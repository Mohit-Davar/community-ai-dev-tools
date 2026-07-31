PRAGMA foreign_keys = ON;

-- PRODUCTS
CREATE TABLE products (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- AUDIENCES
CREATE TABLE audiences (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- DOCUMENTATION PROVIDERS
CREATE TABLE providers (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- SOURCES
-- A source can be a Confluence space/page, a GitHub folder, etc.
CREATE TABLE sources (
    id             TEXT PRIMARY KEY,
    provider_id    TEXT    NOT NULL,
    name           TEXT    NOT NULL,
    config         TEXT    NOT NULL, -- JSON config passed to the provider
    last_synced_at INTEGER,
    FOREIGN KEY(provider_id) REFERENCES providers(id) ON DELETE CASCADE
);
CREATE INDEX idx_sources_provider ON sources(provider_id);

-- COLLECTIONS
-- A collection groups pages returned by one source sync.
CREATE TABLE collections (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    source_id  TEXT NOT NULL,
    name       TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(source_id)  REFERENCES sources(id)  ON DELETE CASCADE
);
CREATE INDEX idx_collections_product ON collections(product_id);
CREATE INDEX idx_collections_source  ON collections(source_id);

-- PAGES
CREATE TABLE pages (
    id            TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    audience_id   TEXT,
    title         TEXT NOT NULL,
    content       TEXT,
    source_path   TEXT NOT NULL,
    last_modified INTEGER,
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(audience_id)   REFERENCES audiences(id)   ON DELETE SET NULL,
    UNIQUE(collection_id, source_path)
);
CREATE INDEX idx_pages_collection ON pages(collection_id);
CREATE INDEX idx_pages_audience   ON pages(audience_id);
CREATE INDEX idx_pages_path       ON pages(source_path);

-- PAGE RELATIONSHIPS
-- Stores parent / previous / next links resolved after all pages are upserted.
CREATE TABLE page_relationships (
    from_page_id      TEXT NOT NULL,
    to_page_id        TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK (
        relationship_type IN ('parent', 'child', 'next', 'previous', 'reference')
    ),
    PRIMARY KEY (from_page_id, to_page_id, relationship_type),
    FOREIGN KEY(from_page_id) REFERENCES pages(id) ON DELETE CASCADE,
    FOREIGN KEY(to_page_id)   REFERENCES pages(id) ON DELETE CASCADE
);
CREATE INDEX idx_page_relationships_from ON page_relationships(from_page_id);
CREATE INDEX idx_page_relationships_to   ON page_relationships(to_page_id);

-- FULL TEXT SEARCH
CREATE VIRTUAL TABLE page_search
USING fts5(
    title,
    content,
    content='pages',
    content_rowid='rowid'
);

-- SYNC LOG
CREATE TABLE IF NOT EXISTS sync_log (
    id            TEXT    PRIMARY KEY,
    source_id     TEXT    NOT NULL,
    triggered_by  TEXT    NOT NULL CHECK (triggered_by IN ('webhook', 'schedule', 'manual')),
    status        TEXT    NOT NULL CHECK (status IN ('started', 'success', 'error')),
    pages_added   INTEGER DEFAULT 0,
    pages_updated INTEGER DEFAULT 0,
    pages_removed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at    INTEGER NOT NULL,
    completed_at  INTEGER,
    FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON sync_log(source_id);

-- FTS5 SYNC TRIGGERS
CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
    INSERT INTO page_search(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
    INSERT INTO page_search(page_search, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
    INSERT INTO page_search(rowid, title, content)
    VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
    INSERT INTO page_search(page_search, rowid, title, content)
    VALUES ('delete', old.rowid, old.title, old.content);
END;


-- ---------------------------------------------------------------------------
-- MOCK DATA
-- ---------------------------------------------------------------------------

-- PRODUCTS
-- ┌──────────────┬──────────────────────┐
-- │ id           │ name                 │
-- ├──────────────┼──────────────────────┤
-- │ mifosx       │ Mifos X              │
-- │ fineract     │ Apache Fineract      │
-- └──────────────┴──────────────────────┘

-- AUDIENCES
-- ┌────────────────┬───────────────────────┐
-- │ id             │ name                  │
-- ├────────────────┼───────────────────────┤
-- │ end-user       │ End User              │
-- │ developer      │ Developer             │
-- │ implementer    │ Implementer           │
-- │ administrator  │ Administrator         │
-- └────────────────┴───────────────────────┘

-- PROVIDERS
-- ┌──────────────┬──────────────────────┐
-- │ id           │ name                 │
-- ├──────────────┼──────────────────────┤
-- │ gitbook      │ GitBook              │
-- │ readme       │ ReadMe               │
-- │ confluence   │ Confluence           │
-- └──────────────┴──────────────────────┘

-- SOURCES
-- Each source is one atomic doc set. Config JSON is passed directly to the provider.
-- CONFLUENCE_BASE_URL / CONFLUENCE_EMAIL / CONFLUENCE_API_TOKEN come from env vars — not config.
--
-- gitbook-docs
--   Provider : gitbook
--   Name     : Mifos GitBook
--   Config   : { "owner": "openMF", "repo": "mifos-gitbook", "ref": "main" }
--
-- confluence-dev
--   Provider : confluence
--   Name     : Internal Engineering Wiki
--   Config   : { "spaceKey": "ENG" }
--
-- readme-api
--   Provider : readme
--   Name     : Public API Documentation
--   Config   : { "owner": "company", "repo": "api-docs" }

-- COLLECTIONS
-- One collection is created per source sync run.
--
-- gitbook-core
--   Product : mifosx
--   Source  : gitbook-docs
--   Name    : Core Documentation
--
-- readme-api-coll
--   Product : mifosx
--   Source  : readme-api
--   Name    : API Reference
--
-- confluence-engineering
--   Product : mifosx
--   Source  : confluence-dev
--   Name    : Engineering Wiki

-- PAGES
-- audience_id is optional; pages without one are visible to all audiences.
--
-- docs/index.md
--   Title      : Introduction
--   Collection : gitbook-core
--   Audience   : end-user
--
-- docs/getting-started.md
--   Title      : Getting Started
--   Collection : gitbook-core
--   Audience   : end-user
--
-- docs/installation.md
--   Title      : Installation
--   Collection : gitbook-core
--   Audience   : implementer
--
-- docs/api/authentication.md
--   Title      : Authentication
--   Collection : readme-api-coll
--   Audience   : developer
--
-- docs/api/accounts.md
--   Title      : Accounts API
--   Collection : readme-api-coll
--   Audience   : developer
--
-- ENG/18273645
--   Title      : Deployment Architecture
--   Collection : confluence-engineering
--   Audience   : administrator
--
-- ENG/18273680
--   Title      : CI/CD Pipeline
--   Collection : confluence-engineering
--   Audience   : developer

-- PAGE RELATIONSHIPS
-- from_page_id and to_page_id are the internal page IDs (sha256 hash slice).
-- relationship_type ∈ { parent, child, next, previous, reference }
--
-- Tree:
--   Introduction (docs/index.md)
--     ├── child → Getting Started
--     │              └── next → Installation
--     └── child → Authentication
--                    └── next → Accounts API
--
-- Example relationship rows:
--   from = docs/index.md              to = docs/getting-started.md      type = child
--   from = docs/getting-started.md    to = docs/index.md                type = parent
--   from = docs/getting-started.md    to = docs/installation.md         type = next
--   from = docs/installation.md       to = docs/getting-started.md      type = previous
--   from = docs/api/authentication.md to = docs/api/accounts.md         type = next

-- SYNC LOG
-- Sync #1
--   Source        : gitbook-docs
--   Triggered By  : schedule
--   Status        : success
--   Added         : 48
--   Updated       : 3
--   Removed       : 0
-- Sync #2
--   Source        : confluence-dev
--   Triggered By  : webhook
--   Status        : success
--   Added         : 0
--   Updated       : 1
--   Removed       : 0
-- Sync #3
--   Source        : readme-api
--   Triggered By  : manual
--   Status        : error
--   Error         : Failed to authenticate with ReadMe API
