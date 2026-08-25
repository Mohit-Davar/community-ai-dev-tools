import path from "path";

import { readText } from "@/utils/files";
import { buildNormalisedMarkdown } from "@/utils/markdown";

import type { NormalisedDoc, NormalisedDocMeta } from "@/types/index";

/**
 * Normalises a single Confluence Markdown file.
 *
 * Reads the raw file, creates metadata, and wraps the content
 * with YAML frontmatter.
 */
export async function normaliseConfluence(
  srcPath: string,
  featureId: string,
  sourceUrl?: string
): Promise<NormalisedDoc> {
  // Read the raw Confluence Markdown file.
  const rawContent = await readText(srcPath);
  // Use the filename as the source ID.
  const sourceId = path.basename(srcPath, path.extname(srcPath));
  // Build metadata for the document.
  const meta: NormalisedDocMeta = {
    source_type: "confluence",
    source_id: sourceId,
    source_url: sourceUrl ?? "",
    content_type: "page",
    feature_id: featureId,
  };
  // Add YAML frontmatter to the Markdown content.
  const markdownContent = buildNormalisedMarkdown(meta, rawContent);
  // Return the normalised document.
  // filePath will be set after the document is written.
  return {
    meta,
    content: markdownContent,
    filePath: "",
  };
}
