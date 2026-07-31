import pLimit from "p-limit";
import path from "path";

import { parseMarkdown } from "@/helpers/parse-markdown";
import { fetchFileContent, fetchRepoTree } from "@/providers/github/fetcher";
import { parseOrderYaml } from "@/providers/github/readme/parser";
import type {
  ReadMeConfig,
  ReadMeOrderMap,
} from "@/providers/github/readme/types";
import type { TreeItem } from "@/providers/github/types";
import type {
  IDocProvider,
  RawCollection,
  RawPage,
} from "@/providers/interface";

/**
 * ReadMeProvider implements the `IDocProvider` interface.
 *
 * It connects to a GitHub repository, discovers Markdown files and `_order.yaml` files,
 * fetches content concurrently with rate-limiting, extracts metadata/hierarchy,
 * and sorts files according to custom ordering manifests.
 */
export class ReadMeProvider implements IDocProvider {
  readonly providerId = "readme";

  /**
   * Concurrency limiter: ensures maximum 5 concurrent outbound API calls
   * to avoid triggering GitHub rate-limits or exhausting system memory.
   */
  private readonly limit = pLimit(5);

  constructor(
    private readonly sourceId: string,
    private readonly config: ReadMeConfig
  ) {}

  /**
   * Groups pages by directory, sorts them according to rules defined in `_order.yaml`
   * (or falls back to alphabetical order), and sets sequential `previousExternalId`
   * and `nextExternalId` pointers between siblings.
   *
   * @param pages    - Array of parsed Markdown pages.
   * @param orderMap - Dictionary mapping directory paths to custom ordered filename arrays.
   */
  private applyOrdering(pages: RawPage[], orderMap: ReadMeOrderMap): void {
    // Group pages by their containing directory path
    const byDir = new Map<string, RawPage[]>();
    for (const page of pages) {
      const dir = path.dirname(page.externalId);
      const list = byDir.get(dir);
      if (list) {
        list.push(page);
      } else {
        byDir.set(dir, [page]);
      }
    }
    // Sort pages within each directory individually
    for (const [dir, dirPages] of byDir) {
      const order = orderMap[dir] ?? [];
      dirPages.sort((a, b) => {
        const aName = path.basename(a.externalId, ".md");
        const bName = path.basename(b.externalId, ".md");
        const aIdx = order.indexOf(aName);
        const bIdx = order.indexOf(bName);
        // Case A: Both files are listed in `_order.yaml` -> sort by specified index
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        // Case B: Only file A is in `_order.yaml` -> prioritize file A
        if (aIdx !== -1) return -1;
        // Case C: Only file B is in `_order.yaml` -> prioritize file B
        if (bIdx !== -1) return 1;
        // Case D: Neither file is listed -> sort alphabetically by filename
        return aName.localeCompare(bName);
      });
      // Assign sibling navigation links (`previousExternalId` & `nextExternalId`)
      for (const [i, currentPage] of dirPages.entries()) {
        currentPage.previousExternalId = dirPages[i - 1]?.externalId ?? null;
        currentPage.nextExternalId = dirPages[i + 1]?.externalId ?? null;
      }
    }
  }

  /**
   * Main entry point for full synchronisation.
   * Fetches the repo tree, identifies markdown files & manifests, parses files,
   * builds hierarchical parent/child links, and sorts pages before returning them.
   *
   * @returns A promise resolving to an array containing a single `RawCollection`.
   */
  async fetchAll(): Promise<RawCollection[]> {
    const { owner, repo } = this.config;
    // Fall back to default branch 'main' and root directory '' if not configured
    const ref = this.config.ref ?? "main";
    const basePath = this.config.basePath ?? "";
    // Fetch the complete file tree for the repository in a single API call
    const tree = await fetchRepoTree(owner, repo, ref);
    // Holders for filtered file manifests and raw tree nodes
    const markdownFiles: TreeItem[] = [];
    const orderMap: ReadMeOrderMap = {};
    // Filter tree items and download all `_order.yaml` manifest files concurrently
    await Promise.all(
      tree
        .filter(
          (file) =>
            file.type === "blob" && // Ensure it's a file, not a directory
            file.path.startsWith(basePath) && // Ensure file lives under configured basePath
            (file.path.endsWith(".md") || file.path.endsWith("_order.yaml"))
        )
        .map((file) =>
          this.limit(async () => {
            if (file.path.endsWith("_order.yaml")) {
              // Fetch manifest content and parse ordering schema for this directory
              const content = await fetchFileContent(
                owner,
                repo,
                file.path,
                ref
              );
              orderMap[path.dirname(file.path)] = parseOrderYaml(content);
            } else {
              // Save markdown file references for processing in the next step
              markdownFiles.push(file);
            }
          })
        )
    );
    // Process each Markdown file into a standardised `RawPage` structure
    const pages: RawPage[] = [];
    await Promise.all(
      markdownFiles.map((file) =>
        this.limit(async () => {
          // Fetch the file contents and extract title, frontmatter, and headings
          const raw = await fetchFileContent(owner, repo, file.path, ref);
          const parsed = await parseMarkdown(raw);
          // Skip hidden docs if specified in frontmatter (`hidden: true`)
          if (parsed.frontmatter.hidden === true) {
            return;
          }
          const dir = path.dirname(file.path);
          const filename = path.basename(file.path, ".md");
          // Compute parental structure (`parentExternalId`) for navigation trees:
          // - `index.md` files link to their grandparent folder's index.
          // - Standard files link to their current folder's `index.md`.
          let parentExternalId: string | null = null;
          if (dir !== "." && dir !== basePath) {
            if (filename === "index") {
              const parentDir = path.dirname(dir);
              if (parentDir !== "." && parentDir !== basePath) {
                parentExternalId = `${parentDir}/index.md`;
              }
            } else {
              parentExternalId = `${dir}/index.md`;
            }
          }
          // Build and store the final page object
          pages.push({
            content: parsed.content,
            externalId: file.path,
            lastModified: undefined, // Populated during delta/incremental sync
            parentExternalId,
            sourcePath: file.path,
            // Priority order for Title: frontmatter title -> first H1 heading -> filename
            title:
              (parsed.frontmatter.title as string) ||
              parsed.headings[0]?.text ||
              filename,
          });
        })
      )
    );
    // Apply order configurations per directory and resolve prev/next page siblings
    this.applyOrdering(pages, orderMap);
    // Return encapsulated document collection
    return [
      {
        externalId: `${owner}/${repo}/${basePath}`,
        name: `${owner}/${repo} ReadMe.io`,
        pages,
      },
    ];
  }

  async fetchUpdated(): Promise<RawCollection[]> {
    return this.fetchAll();
  }
}
