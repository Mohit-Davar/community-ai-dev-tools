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

// Detects whether a worksheet name / content suggests it's a worked scenario.
// Heuristic: name contains "scenario", "example", "case", "test", "worked".
export function isScenarioSheet(sheetName: string): boolean {
  const lower = sheetName.toLowerCase();
  return (
    lower.includes("scenario") ||
    lower.includes("example") ||
    lower.includes("case") ||
    lower.includes("test") ||
    lower.includes("worked") ||
    lower.includes("sample")
  );
}
