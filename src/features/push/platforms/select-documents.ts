import type { ChangedFile, PushChanges } from "@src/features/push/git-diff";
import type { SelectableDocument } from "@src/features/push/platforms";
import type { DocAudience } from "@src/shared";
import {
  callWithRetry,
  chunkDiffs,
  MAX_CONCURRENT_CHUNKS,
  tokenizer,
} from "@src/shared";
import pLimit from "p-limit";
import { z } from "zod/v4";

function countTokens(file: ChangedFile) {
  return tokenizer.encode(`FILE ${file.path}\n${file.diff}`).length;
}
// Response schema for document selection.
const DocumentSelectionSchema = z.object({
  selected: z
    .array(z.string())
    .describe(
      "Keys of the documents that should be updated. Return only keys from the provided list."
    ),
});

const SYSTEM_PROMPT = `
You are a technical documentation manager.

Given a list of documentation pages and a code change set, select only the pages that need updating.

Guidelines:
- Select only pages directly affected by the changes.
- Prefer false negatives over false positives.
- Return only keys from the provided document list.
`.trim();

/**
 * Select the documents that should be updated.
 */
export async function selectDocuments(
  documents: SelectableDocument[],
  pushChanges: PushChanges,
  audience: DocAudience
): Promise<string[]> {
  if (documents.length === 0) {
    return [];
  }

  const documentList = documents
    .map((doc) => `- key: "${doc.key}" | description: "${doc.purpose}"`)
    .join("\n");

  const diffChunks = chunkDiffs(pushChanges.fileChanges, countTokens);
  const selectedKeys = new Set<string>();
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);

  const chunkResults = await Promise.all(
    diffChunks.map((chunk) =>
      limit(async () => {
        const diffText = chunk.diffs
          .map((file) => `FILE ${file.path}\n${file.diff}`)
          .join("\n\n");

        const prompt = [
          `Audience: ${audience}`,
          `Available documents:\n${documentList}`,
          `Changed files:\n${pushChanges.changedFiles.join("\n")}`,
          `Diff:\n${diffText}`,
        ].join("\n\n");

        return callWithRetry(
          SYSTEM_PROMPT,
          prompt,
          DocumentSelectionSchema,
          "document_selection"
        );
      })
    )
  );

  const validKeys = new Set(documents.map((doc) => doc.key));
  for (const result of chunkResults) {
    for (const key of result.selected) {
      if (validKeys.has(key)) {
        selectedKeys.add(key);
      }
    }
  }

  return Array.from(selectedKeys);
}
