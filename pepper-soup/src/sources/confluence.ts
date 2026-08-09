import path from "path";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/llm/client";
import { NormalisedConfluenceSchema } from "@/llm/schemas";
import { confluenceNormalisationMessages } from "@/llm/prompts";
import { OPENAI_MODEL } from "@/config";
import { readText } from "@/utils/files";
import { buildNormalisedMarkdown } from "@/utils/markdown";
import type { NormalisedDoc, NormalisedDocMeta } from "@/types/index";

/**
 * Normalises a single Confluence Markdown export file using the LLM.
 *
 * The LLM cleans up Confluence-specific formatting artifacts, preserves
 * all content exactly, and returns clean Markdown. The result is wrapped
 * with YAML frontmatter and returned as a NormalisedDoc.
 *
 * @param srcPath   Absolute path to the raw Confluence .md file
 * @param featureId The feature this document belongs to
 * @param sourceUrl Optional URL of the original Confluence page
 */
export async function normaliseConfluence(
  srcPath: string,
  featureId: string,
  sourceUrl?: string
): Promise<NormalisedDoc> {
  const rawContent = await readText(srcPath);
  const sourceId = path.basename(srcPath, path.extname(srcPath));
  const messages = confluenceNormalisationMessages(rawContent);
  const completion = await openai.chat.completions.parse({
    model: OPENAI_MODEL,
    messages,
    response_format: zodResponseFormat(
      NormalisedConfluenceSchema,
      "normalised_confluence"
    ),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(
      `[confluence] LLM returned null for: ${path.basename(srcPath)}`
    );
  }
  const meta: NormalisedDocMeta = {
    source_type: "confluence",
    source_id: sourceId,
    source_url: sourceUrl ?? "",
    content_type: "page",
    feature_id: featureId,
  };

  const markdownContent = buildNormalisedMarkdown(meta, parsed.clean_markdown);

  return {
    meta,
    content: markdownContent,
    filePath: "", // will be set by Stage 2 after writing
  };
}
