import { db } from "@/lib/db-client";
import type { SearchParams } from "@/models/types.model";

/**
 * Returns a page by its internal ID, along with its page_relationships
 * (parent, previous, next links with title previews).
 */
export function getPageByIdQuery(pageId: string) {
  const page = db.prepare("SELECT * FROM pages WHERE id = ?").get(pageId);
  if (!page) {
    return null;
  }

  const relationships = db
    .prepare(
      `
      SELECT
        p.id,
        p.title,
        pr.relationship_type
      FROM page_relationships pr
      JOIN pages p ON pr.to_page_id = p.id
      WHERE pr.from_page_id = ?
      `
    )
    .all(pageId);

  return { page, relationships };
}

/**
 * Full-text search across page title and content.
 * Optionally filtered by source ID or audience name.
 */
export function searchQuery({ audience, limit, q, source }: SearchParams) {
  return db
    .prepare(
      `
      SELECT
        p.id,
        p.title,
        p.source_path,
        snippet(page_search, 0, '<mark>', '</mark>', '...', 15) AS title_snippet,
        snippet(page_search, 1, '<mark>', '</mark>', '...', 30) AS content_snippet,
        rank
      FROM page_search
      JOIN pages p       ON page_search.rowid = p.rowid
      JOIN collections c ON p.collection_id = c.id
      LEFT JOIN audiences a ON p.audience_id = a.id
      WHERE page_search MATCH ?
        AND (? IS NULL OR c.source_id = ?)
        AND (? IS NULL OR a.name = ?)
      ORDER BY rank
      LIMIT ?
      `
    )
    .all(
      q,
      source ?? null,
      source ?? null,
      audience ?? null,
      audience ?? null,
      limit
    );
}

/** Lists all registered sources (for the /sources API endpoint). */
export function getSourcesQuery() {
  return db
    .prepare(
      `
      SELECT
        id,
        provider_id,
        name,
        last_synced_at
      FROM sources
      `
    )
    .all();
}

/** Returns a single source row by ID, or undefined if not found. */
export function getSourceByIdQuery(sourceId: string) {
  return db.prepare("SELECT id FROM sources WHERE id = ?").get(sourceId);
}
