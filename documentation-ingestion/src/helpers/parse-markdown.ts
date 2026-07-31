import type { Heading, Link, Paragraph, Root, Text } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkParseFrontmatter from "remark-parse-frontmatter";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export interface ParsedMarkdown {
  content: string;
  frontmatter: Record<string, unknown>;
  headings: { anchor: string; depth: number; text: string }[];
  links: { isExternal: boolean; text: string; url: string }[];
  renderedHtml: string;
  summary: string;
}

export async function parseMarkdown(raw: string): Promise<ParsedMarkdown> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkParseFrontmatter)
    .use(remarkRehype)
    .use(rehypeStringify);
  const file = await processor.process(raw);
  const mdastTree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .parse(raw) as Root;
  return {
    content: toPlainText(mdastTree),
    frontmatter: (file.data.frontmatter as Record<string, unknown>) || {},
    headings: extractHeadings(mdastTree),
    links: extractLinks(mdastTree),
    renderedHtml: file.toString(),
    summary: extractSummary(mdastTree),
  };
}

export function extractHeadings(tree: Root): ParsedMarkdown["headings"] {
  const headings: ParsedMarkdown["headings"] = [];
  visit(tree, "heading", (node: Heading) => {
    let text = "";
    visit(node, "text", (textNode: Text) => {
      text += textNode.value;
    });
    const anchor = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    headings.push({
      anchor,
      depth: node.depth,
      text: text,
    });
  });
  return headings;
}

export function extractLinks(tree: Root): ParsedMarkdown["links"] {
  const links: ParsedMarkdown["links"] = [];
  visit(tree, "link", (node: Link) => {
    let text = "";
    visit(node, "text", (textNode: Text) => {
      text += textNode.value;
    });
    const isExternal =
      node.url.startsWith("http://") || node.url.startsWith("https://");
    links.push({
      isExternal,
      text: text,
      url: node.url,
    });
  });
  return links;
}

export function toPlainText(tree: Root): string {
  let text = "";
  visit(tree, "text", (node: Text) => {
    text += node.value + " ";
  });
  return text.trim();
}

export function extractSummary(tree: Root): string {
  let summary = "";
  visit(tree, "paragraph", (node: Paragraph) => {
    if (summary) {
      return; // already found first paragraph
    }
    let text = "";
    visit(node, "text", (textNode: Text) => {
      text += textNode.value;
    });
    if (text.trim().length > 0) {
      summary = text.trim();
      if (summary.length > 200) {
        summary = summary.substring(0, 197) + "...";
      }
    }
  });
  return summary;
}
