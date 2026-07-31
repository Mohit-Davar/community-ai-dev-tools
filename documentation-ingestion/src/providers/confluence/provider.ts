import pLimit from "p-limit";

import {
  fetchPageAttachments,
  fetchPagesInSpace,
  fetchPageWithBody,
  fetchSpaces,
} from "@/providers/confluence/fetcher.ts";
import { parseConfluenceStorage } from "@/providers/confluence/parser.ts";
import type {
  IDocProvider,
  RawCollection,
  RawPage,
} from "@/providers/interface.ts";

/**
 * Config stored in sources.config (JSON).
 *
 * Exactly one of `pageId` or `spaceKey` must be provided:
 * - `pageId`   — index a single Confluence page and all its descendants
 * - `spaceKey` — index every page in a Confluence space (e.g. "ENG")
 */
export interface ConfluenceConfig {
  pageId?: string;
  spaceKey?: string;
}

const CONCURRENCY = 5;

export class ConfluenceProvider implements IDocProvider {
  readonly providerId = "confluence";

  private readonly limit = pLimit(CONCURRENCY);

  constructor(
    private readonly sourceId: string,
    private readonly config: ConfluenceConfig
  ) {
    if (!config.pageId && !config.spaceKey) {
      throw new Error(
        "[ConfluenceProvider] config must contain either pageId or spaceKey"
      );
    }
  }

  // ─── IDocProvider ──────────────────────────────────────────────────────────

  async fetchAll(): Promise<RawCollection[]> {
    if (this.config.pageId) {
      return this.fetchPageSubtree(this.config.pageId);
    }
    return this.fetchSpace(this.config.spaceKey!);
  }

  async fetchUpdated(_since: Date): Promise<RawCollection[]> {
    // For v1, fall back to a full sync.
    // A future version can use Confluence CQL: lastmodified >= "..."
    return this.fetchAll();
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Fetches a single Confluence page and all pages that share its space,
   * but scoped to the subtree rooted at `pageId`.
   *
   * Note: Confluence API v2 does not expose a "children recursive" endpoint,
   * so we fetch all pages in the space and keep those whose ancestor chain
   * includes the target page. For v1, we simply index the whole space but
   * label the collection after the root page.
   */
  private async fetchPageSubtree(rootPageId: string): Promise<RawCollection[]> {
    const rootPage = await fetchPageWithBody(rootPageId);
    const spaceId = rootPage.spaceId;

    const allPages = await fetchPagesInSpace(spaceId);
    // Filter to only the root page and its descendants by parent chain
    const idsInSubtree = this.resolveSubtree(rootPageId, allPages);

    const rawPages = await this.fetchRawPages(
      allPages.filter((p) => idsInSubtree.has(p.id))
    );

    return [
      {
        externalId: `confluence-page-${rootPageId}`,
        name: rootPage.title,
        pages: rawPages,
      },
    ];
  }

  /**
   * Fetches every page in the Confluence space identified by `spaceKey`.
   */
  private async fetchSpace(spaceKey: string): Promise<RawCollection[]> {
    const spaces = await fetchSpaces();
    const space = spaces.find((s) => s.key === spaceKey);
    if (!space) {
      console.warn(`[ConfluenceProvider] Space '${spaceKey}' not found.`);
      return [];
    }

    const allPages = await fetchPagesInSpace(space.id);
    const rawPages = await this.fetchRawPages(allPages);

    return [
      {
        externalId: `confluence-space-${space.id}`,
        name: space.name,
        pages: rawPages,
      },
    ];
  }

  /**
   * Given a list of shallow page metadata, fetches body + attachments for each
   * page concurrently and returns the assembled RawPage array.
   */
  private async fetchRawPages(
    pageMetas: Array<{ id: string }>
  ): Promise<RawPage[]> {
    const rawPages: RawPage[] = [];

    await Promise.all(
      pageMetas.map((meta) =>
        this.limit(async () => {
          try {
            const page = await fetchPageWithBody(meta.id);
            const attachments = await fetchPageAttachments(meta.id);

            // Build filename → download URL map for the parser
            const attachmentUrlMap = new Map<string, string>(
              attachments.map((att) => [att.title, att._links.download])
            );

            const xhtml = page.body?.storage?.value ?? "";
            const content = await parseConfluenceStorage(
              xhtml,
              attachmentUrlMap
            );

            rawPages.push({
              content,
              externalId: page.id,
              lastModified: new Date(page.version.createdAt).getTime(),
              parentExternalId: page.parentId ?? null,
              sourcePath: `${page.spaceId}/${page.id}`,
              title: page.title,
            });
          } catch (err) {
            console.warn(
              `[ConfluenceProvider] Failed to fetch page ${meta.id}: ${err}`
            );
          }
        })
      )
    );

    return rawPages;
  }

  /**
   * Returns the set of page IDs that belong to the subtree rooted at `rootId`.
   * Uses the parentId chain from the flat page list returned by the space API.
   */
  private resolveSubtree(
    rootId: string,
    allPages: Array<{ id: string; parentId: string | null }>
  ): Set<string> {
    const result = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const page of allPages) {
        if (
          !result.has(page.id) &&
          page.parentId &&
          result.has(page.parentId)
        ) {
          result.add(page.id);
          changed = true;
        }
      }
    }
    return result;
  }
}
