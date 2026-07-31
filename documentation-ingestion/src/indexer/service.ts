import { generatePageId, normalisePage } from "../helpers/normalise-page.ts";
import { db } from "../lib/db-client.ts";
import { ConfluenceProvider } from "../providers/confluence/provider.ts";
import { GitBookProvider } from "../providers/github/gitbook/provider.ts";
import { ReadMeProvider } from "../providers/github/readme/provider.ts";
import type { IDocProvider, RawCollection } from "../providers/interface.ts";
import { SyncMonitor, type SyncTrigger } from "./sync-monitor.ts";

// ─── Internal types for DB rows ────────────────────────────────────────────

interface SourceRow {
  config: string; // JSON
  id: string;
  provider_id: string;
}

// ─── IndexerService ────────────────────────────────────────────────────────

export class IndexerService {
  // ─── Provider factory ─────────────────────────────────────────────────────

  private getProvider(sourceId: string): IDocProvider {
    const row = db
      .prepare("SELECT id, provider_id, config FROM sources WHERE id = ?")
      .get(sourceId) as SourceRow | undefined;

    if (!row) {
      throw new Error(`[Indexer] Source '${sourceId}' not found`);
    }

    const config = JSON.parse(row.config) as Record<string, unknown>;

    switch (row.provider_id) {
      case "gitbook":
        return new GitBookProvider(sourceId, config as any);
      case "readme":
        return new ReadMeProvider(sourceId, config as any);
      case "confluence":
        return new ConfluenceProvider(sourceId, config as any);
      default:
        throw new Error(`[Indexer] Unknown provider '${row.provider_id}'`);
    }
  }

  // ─── Public sync API ──────────────────────────────────────────────────────

  /** Fetches all pages from a source and writes them to the DB. */
  async fullSync(
    sourceId: string,
    trigger: SyncTrigger = "manual"
  ): Promise<void> {
    const monitor = new SyncMonitor(sourceId, trigger);
    monitor.start();
    try {
      const provider = this.getProvider(sourceId);
      const collections = await provider.fetchAll();
      this.upsertCollections(sourceId, collections, monitor);
      monitor.complete();
    } catch (err) {
      console.error(`[Indexer] fullSync failed for ${sourceId}:`, err);
      monitor.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Syncs a single Confluence page by its external page ID.
   * Used by the Confluence webhook handler for targeted updates.
   */
  async syncConfluencePage(sourceId: string, pageId: string): Promise<void> {
    const row = db
      .prepare("SELECT provider_id FROM sources WHERE id = ?")
      .get(sourceId) as Pick<SourceRow, "provider_id"> | undefined;

    if (!row || row.provider_id !== "confluence") {
      console.warn(
        `[Indexer] syncConfluencePage: source '${sourceId}' is not a Confluence source`
      );
      return;
    }

    // Create a temporary provider scoped to this single page
    const provider = new ConfluenceProvider(sourceId, { pageId });
    const monitor = new SyncMonitor(sourceId, "webhook");
    monitor.start();
    try {
      const collections = await provider.fetchAll();
      this.upsertCollections(sourceId, collections, monitor);
      monitor.complete();
    } catch (err) {
      console.error(
        `[Indexer] syncConfluencePage failed for page ${pageId}:`,
        err
      );
      monitor.fail(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Removes a single page from the DB by its external ID.
   * Used by the Confluence webhook handler for delete events.
   */
  removeDocument(sourceId: string, externalId: string): void {
    const pageId = generatePageId(sourceId, externalId);
    db.prepare("DELETE FROM pages WHERE id = ?").run(pageId);
  }

  /** Triggered by a GitHub push webhook — re-syncs all matching sources. */
  async handleGitHubPush(
    owner: string,
    repo: string,
    _commits: unknown[]
  ): Promise<void> {
    const sources = db
      .prepare(
        `SELECT id, config FROM sources WHERE provider_id IN ('gitbook', 'readme')`
      )
      .all() as Pick<SourceRow, "id" | "config">[];

    for (const source of sources) {
      const config = JSON.parse(source.config) as {
        owner?: string;
        repo?: string;
      };
      if (config.owner === owner && config.repo === repo) {
        void this.fullSync(source.id, "webhook");
      }
    }
  }

  /** Kicks off a full sync for every registered source on startup. */
  async initialSyncAll(): Promise<void> {
    const sources = db.prepare("SELECT id FROM sources").all() as Pick<
      SourceRow,
      "id"
    >[];

    for (const source of sources) {
      void this.fullSync(source.id, "schedule");
    }
  }

  // ─── DB helpers ───────────────────────────────────────────────────────────

  /**
   * Upserts all collections and their pages, resolves page relationships,
   * then prunes any pages that are no longer present in the fetched data.
   */
  private upsertCollections(
    sourceId: string,
    rawCollections: RawCollection[],
    monitor: SyncMonitor
  ): void {
    db.transaction(() => {
      const upsertCollection = db.prepare(`
        INSERT INTO collections (id, product_id, source_id, name)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name = excluded.name
      `);

      const upsertPage = db.prepare(`
        INSERT INTO pages (id, collection_id, audience_id, title, content, source_path, last_modified)
        VALUES ($id, $collection_id, $audience_id, $title, $content, $source_path, $last_modified)
        ON CONFLICT(collection_id, source_path) DO UPDATE SET
          title         = excluded.title,
          content       = excluded.content,
          last_modified = excluded.last_modified
      `);

      // Map externalId → internal page ID so we can wire relationships afterwards
      const extToId = new Map<string, string>();
      const allSourcePaths = new Set<string>();

      for (const coll of rawCollections) {
        upsertCollection.run(
          coll.externalId,
          "default_product",
          sourceId,
          coll.name
        );

        for (const rawPage of coll.pages) {
          const norm = normalisePage(sourceId, coll.externalId, rawPage);
          extToId.set(rawPage.externalId, norm.id);
          allSourcePaths.add(norm.source_path);

          upsertPage.run({
            $audience_id: norm.audience_id,
            $collection_id: norm.collection_id,
            $content: norm.content,
            $id: norm.id,
            $last_modified: norm.last_modified,
            $source_path: norm.source_path,
            $title: norm.title,
          });

          monitor.addStat("pagesAdded", 1);
        }
      }

      // Resolve parent / previous / next relationships now that all pages exist
      this.upsertRelationships(sourceId, rawCollections, extToId);

      // Prune pages no longer returned by the provider
      this.pruneRemovedPages(rawCollections, allSourcePaths, monitor);
    })();
  }

  /**
   * Deletes all existing relationships for the source, then re-inserts them
   * from the current RawCollection data.
   */
  private upsertRelationships(
    sourceId: string,
    rawCollections: RawCollection[],
    extToId: Map<string, string>
  ): void {
    // Clear stale relationships for this source in one shot
    db.prepare(
      `
      DELETE FROM page_relationships
      WHERE from_page_id IN (
        SELECT p.id FROM pages p
        JOIN collections c ON p.collection_id = c.id
        WHERE c.source_id = ?
      )
    `
    ).run(sourceId);

    const insertRel = db.prepare(`
      INSERT INTO page_relationships (from_page_id, to_page_id, relationship_type)
      VALUES (?, ?, ?)
      ON CONFLICT DO NOTHING
    `);

    for (const coll of rawCollections) {
      for (const page of coll.pages) {
        const fromId = extToId.get(page.externalId);
        if (!fromId) continue;

        if (page.parentExternalId) {
          const toId = extToId.get(page.parentExternalId);
          if (toId) insertRel.run(fromId, toId, "parent");
        }
        if (page.previousExternalId) {
          const toId = extToId.get(page.previousExternalId);
          if (toId) insertRel.run(fromId, toId, "previous");
        }
        if (page.nextExternalId) {
          const toId = extToId.get(page.nextExternalId);
          if (toId) insertRel.run(fromId, toId, "next");
        }
      }
    }
  }

  /** Deletes pages in each collection whose source_path is no longer present. */
  private pruneRemovedPages(
    rawCollections: RawCollection[],
    allSourcePaths: Set<string>,
    monitor: SyncMonitor
  ): void {
    if (allSourcePaths.size === 0) return;

    const placeholders = Array.from(allSourcePaths)
      .map(() => "?")
      .join(", ");

    for (const coll of rawCollections) {
      const result = db
        .prepare(
          `DELETE FROM pages WHERE collection_id = ? AND source_path NOT IN (${placeholders})`
        )
        .run(coll.externalId, ...Array.from(allSourcePaths));

      monitor.addStat("pagesRemoved", result.changes);
    }
  }
}
