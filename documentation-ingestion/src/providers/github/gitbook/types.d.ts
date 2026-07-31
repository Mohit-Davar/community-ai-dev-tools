/**
 * Represents a hierarchical node within the documentation tree parsed from `SUMMARY.md`.
 *
 * @property children - Nested sub-pages/sections under this node.
 * @property path     - The relative path or URL targeted by the node's link (e.g., "getting-started.md").
 * @property title    - The extracted plain text display title of the link.
 */
export interface SummaryNode {
  children: SummaryNode[];
  path: string;
  title: string;
}

/**
 * Represents a page flattened from the documentation tree, complete with
 * explicit parent, previous, and next links for step-by-step sequential navigation.
 */
export interface FlattenedPage {
  nextPath: string | null;
  parentPath: string | null;
  path: string;
  previousPath: string | null;
  title: string;
}
