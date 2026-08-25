import matter from "gray-matter";
import type { NormalisedDocMeta } from "@/types/index.js";

// Builds a Markdown file string with YAML frontmatter.
export function buildNormalisedMarkdown(
  meta: NormalisedDocMeta,
  body: string
): string {
  return matter.stringify(
    body.trimStart(),
    meta as unknown as Record<string, unknown>
  );
}

// Parses a normalised Markdown file back into meta + body.
export function parseNormalisedMarkdown(content: string): {
  meta: NormalisedDocMeta;
  body: string;
} {
  const { data, content: body } = matter(content);
  return {
    meta: data as NormalisedDocMeta,
    body: body.trimStart(),
  };
}
