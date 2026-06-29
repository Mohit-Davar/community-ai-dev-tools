import {
  buildUserMessage,
  getRelevantChunkFindings,
  ReviewsSchema,
  SYSTEM_PROMPT,
} from "@src/features/pr/llm-call";
import type { Findings } from "@src/features/pr/security-engine";
import { callWithRetry, type DiffChunk, expectError } from "@src/shared";

// Generate reviews for a single diff chunk.
export async function reviewChunk(
  chunk: DiffChunk,
  securityFindingsByFile: Map<string, Findings[]>,
  cveFindingsByFile: Map<string, Findings[]>
) {
  const message = buildUserMessage(
    chunk,
    getRelevantChunkFindings(chunk, securityFindingsByFile),
    getRelevantChunkFindings(chunk, cveFindingsByFile)
  );

  const [error, result] = await expectError(
    callWithRetry(SYSTEM_PROMPT, message, ReviewsSchema, "reviews")
  );
  if (error) {
    throw new Error("Failed to generate AI review", {
      cause: error,
    });
  }

  return result;
}
