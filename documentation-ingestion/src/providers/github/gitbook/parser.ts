import type { Link, List, ListItem, Root, Text } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type {
  FlattenedPage,
  SummaryNode,
} from "@/providers/github/gitbook/types";

/**
 * Iterates through Markdown list items (`<li>`) and converts each into a `SummaryNode`.
 *
 * @param list - The mdast `List` AST node to process.
 * @returns Array of successfully parsed `SummaryNode` objects.
 */
function parseList(list: List): SummaryNode[] {
  const nodes: SummaryNode[] = [];
  for (const child of list.children) {
    // Only process standard list items, ignore other children types
    if (child.type !== "listItem") {
      continue;
    }
    const node = parseListItem(child);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Parses an individual Markdown `ListItem` (`<li>`) to extract the link, text, and sub-lists.
 *
 * @param item - The mdast `ListItem` AST node to parse.
 * @returns A structured `SummaryNode`, or `null` if no valid local Markdown link is found.
 */
function parseListItem(item: ListItem): SummaryNode | null {
  let link: Link | null = null;
  let title = "";
  // Visit AST nodes to find the primary Markdown link and extract its full text content
  visit(item, "link", (node: Link) => {
    // Capture only the first link found inside this list item
    if (link) {
      return;
    }
    link = node;
    // Concatenate all text nodes inside the link (handles inline code, bold, italics, etc.)
    visit(node, "text", (text: Text) => {
      title += text.value;
    });
  });
  // Ignore list items that do not contain a link
  if (!link) {
    return null;
  }
  // Save to a local variable to help TypeScript narrow the type cleanly
  const targetLink: Link = link;
  // Ignore external links (HTTP/HTTPS) as they are not indexable local documentation pages
  if (
    targetLink.url.startsWith("http://") ||
    targetLink.url.startsWith("https://")
  ) {
    return null;
  }
  const summaryNode: SummaryNode = {
    children: [],
    path: targetLink.url,
    title,
  };
  // Look for nested sub-lists inside this list item to construct the tree recursively
  visit(item, "list", (list: List) => {
    summaryNode.children.push(...parseList(list));
    // Return "skip" to prevent unist-util-visit from traversing deeper into already processed sub-lists
    return "skip";
  });
  return summaryNode;
}

/**
 * Parses the raw string contents of a GitBook-style `SUMMARY.md` file into a flattened
 * array of page references with sibling and parent navigation linkages.
 *
 * @param content - The raw Markdown string content of `SUMMARY.md`.
 * @returns A flattened list of pages ordered sequentially with pre-calculated `nextPath`, `previousPath`, and `parentPath`.
 */
export function parseSummaryMd(content: string): FlattenedPage[] {
  // Parse Markdown string into an MDAST (Markdown Abstract Syntax Tree)
  const tree = unified().use(remarkParse).parse(content) as Root;
  const rootNodes: SummaryNode[] = [];
  // Extract all root-level lists from the document tree
  for (const node of tree.children) {
    if (node.type !== "list") {
      continue;
    }
    rootNodes.push(...parseList(node));
  }
  // Ensure a `README.md` entry exists as the home/introduction page.
  // If not explicitly present in `SUMMARY.md`, prepends a default introduction entry.
  if (!rootNodes.some((node) => node.path.toLowerCase() === "readme.md")) {
    rootNodes.unshift({
      children: [],
      path: "README.md",
      title: "Introduction",
    });
  }
  // Flatten the hierarchical tree into a 1D sequence using depth-first search (DFS)
  const pages: FlattenedPage[] = [];
  const flatten = (node: SummaryNode, parentPath: string | null) => {
    pages.push({
      nextPath: null,
      parentPath,
      path: node.path,
      previousPath: null,
      title: node.title,
    });
    for (const child of node.children) {
      flatten(child, node.path);
    }
  };
  for (const node of rootNodes) {
    flatten(node, null);
  }
  // Connect adjacent sequential siblings (`previousPath` & `nextPath`) for linear reading order.
  // Uses non-null assertions `!` to safely support TS `noUncheckedIndexedAccess`.
  for (let i = 0; i < pages.length; i++) {
    const currentPage = pages[i]!;
    currentPage.previousPath = i > 0 ? pages[i - 1]!.path : null;
    currentPage.nextPath = i < pages.length - 1 ? pages[i + 1]!.path : null;
  }
  return pages;
}
