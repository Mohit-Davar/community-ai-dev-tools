import pLimit from "p-limit";

import { parseMarkdown } from "@/helpers/parse-markdown";
import { fetchFileContent, fetchRepoTree } from "@/providers/github/fetcher";
import { parseSummaryMd } from "@/providers/github/gitbook/parser";
import type {
  IDocProvider,
  RawCollection,
  RawPage,
} from "@/providers/interface";

/**
 * Configuration schema passed into the GitBookProvider constructor.
 *
 * @property basePath - Subdirectory inside the repo where SUMMARY.md and docs live (e.g., "docs/").
 * @property owner    - GitHub organization or account name (e.g., "myorg").
 * @property ref      - Git branch, commit tag, or hash (defaults to "main").
 * @property repo     - Target repository name (e.g., "docs-repo").
 */
export interface GitBookConfig {
  basePath?: string;
  owner: string;
  ref?: string;
  repo: string;
}

/**
 * GitBookProvider implements the `IDocProvider` interface.
 *
 * It parses GitBook-style documentation structures by fetching `SUMMARY.md`, extracting
 * the hierarchical reading order, verifying file existence against the GitHub repo tree,
 * and fetching file contents concurrently with rate limiting.
 */
export class GitBookProvider implements IDocProvider {
  readonly providerId = "gitbook";

  /**
   * Concurrency limiter: enforces a maximum of 5 concurrent network/file fetching requests
   * to avoid triggering GitHub API rate limits.
   */
  private readonly limit = pLimit(5);

  constructor(
    private readonly sourceId: string,
    private readonly config: GitBookConfig
  ) {}

  /**
   * Prepends the configured `basePath` to a relative document path from `SUMMARY.md`.
   * Normalizes leading/trailing slashes to ensure valid path strings.
   *
   * @param filePath - The relative file path (e.g. "getting-started/installation.md")
   * @returns Resolves path including basePath prefix (e.g. "docs/getting-started/installation.md")
   */
  private fullPath(filePath: string): string {
    const relative = filePath.replace(/^\//, ""); // Remove leading slash
    if (!this.config.basePath) {
      return relative;
    }
    return `${this.config.basePath.replace(/\/$/, "")}/${relative}`; // Remove trailing slash from basePath
  }

  /**
   * Main sync method to discover, fetch, and parse all documentation pages defined in SUMMARY.md.
   *
   * @returns A promise resolving to an array containing a single `RawCollection`.
   */
  async fetchAll(): Promise<RawCollection[]> {
    const { owner, repo } = this.config;
    const ref = this.config.ref ?? "main";

    // Fetch SUMMARY.md — the manifest file that dictates hierarchy and reading order
    const summaryPath = this.fullPath("SUMMARY.md");
    let summaryContent: string;
    try {
      summaryContent = await fetchFileContent(owner, repo, summaryPath, ref);
    } catch {
      console.warn(`[GitBookProvider] SUMMARY.md not found at ${summaryPath}.`);
      return [];
    }
    // Parse SUMMARY.md into a linear sequence of pages with parent/next/previous paths
    const pages = parseSummaryMd(summaryContent);
    // Fetch the entire repo file tree to cross-reference and verify file existence
    const tree = await fetchRepoTree(owner, repo, ref);
    const treeMap = new Map(tree.map((item) => [item.path, item] as const));
    // Concurrently fetch and parse Markdown files that are verified to exist in the repository
    const rawPages: RawPage[] = [];
    await Promise.all(
      pages.map((page) =>
        this.limit(async () => {
          const fullPath = this.fullPath(page.path);
          // Verify the file exists in the repo tree; skip dead links in SUMMARY.md
          if (!treeMap.has(fullPath)) {
            return;
          }
          let markdown: string;
          try {
            markdown = await fetchFileContent(owner, repo, fullPath, ref);
          } catch (err) {
            console.warn(`[GitBookProvider] Failed to fetch ${fullPath}:`, err);
            return;
          }
          // Parse Markdown AST to extract body content and headings
          const parsed = await parseMarkdown(markdown);
          // Build standardized RawPage object with pre-computed structural links
          rawPages.push({
            content: parsed.content,
            externalId: fullPath,
            lastModified: undefined, // Populated during delta/incremental sync
            nextExternalId: page.nextPath ? this.fullPath(page.nextPath) : null,
            parentExternalId: page.parentPath
              ? this.fullPath(page.parentPath)
              : null,
            previousExternalId: page.previousPath
              ? this.fullPath(page.previousPath)
              : null,
            sourcePath: page.path,
            // Fall back from page title -> first H1 heading -> file path
            title: page.title || parsed.headings[0]?.text || page.path,
          });
        })
      )
    );
    // Return the processed collection containing all fetched raw pages
    return [
      {
        externalId: `${owner}/${repo}/${this.config.basePath ?? ""}`,
        name: `${owner}/${repo} GitBook`,
        pages: rawPages,
      },
    ];
  }

  /**
   * Fetches updated documentation pages.
   * Currently triggers a full re-fetch.
   */
  async fetchUpdated(): Promise<RawCollection[]> {
    return this.fetchAll();
  }
}
