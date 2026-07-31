/**
 * Configuration schema passed into the ReadMeProvider constructor.
 * Define settings to target a specific GitHub repository location.
 *
 * @property basePath - Optional subdirectory inside the repo to search (e.g., "docs/").
 *                      Only Markdown files under this prefix will be fetched.
 * @property owner    - The GitHub account or organization name (e.g., "openmf").
 * @property ref      - Git branch, commit tag, or hash (defaults to "main").
 * @property repo     - Target repository name (e.g., "reamde-docs").
 */
export interface ReadMeConfig {
  basePath?: string;
  owner: string;
  ref?: string;
  repo: string;
}

/**
 * Maps a directory path (e.g., "docs/getting-started") to an array of filenames
 * in their preferred display order as defined in `_order.yaml`.
 */
export type ReadMeOrderMap = Record<string, string[]>;
