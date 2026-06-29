import {
  createFindingsTable,
  deduplicateReviews,
  reviewChunk,
  type Reviews,
} from "@src/features/pr/llm-call";
import type { Findings } from "@src/features/pr/security-engine";
import {
  chunkDiffs,
  MAX_CONCURRENT_CHUNKS,
  type ParsedFileDiff,
  tokenizer,
} from "@src/shared";
import pLimit from "p-limit";

// Count the number of tokens in a parsed file diff.
export function countTokens(file: ParsedFileDiff): number {
  const formattedDiff = [
    `FILE ${file.file}`,
    ...file.changes.map(
      (change) => `${change.prefix}${change.lineNumber} ${change.content}`
    ),
  ].join("\n");

  return tokenizer.encode(formattedDiff).length;
}

export async function callLLM(
  diffs: ParsedFileDiff[],
  securityFindings: Findings[],
  cveFindings: Findings[]
): Promise<Reviews> {
  // Split large PRs into token-safe chunks.
  const diffChunks = chunkDiffs(diffs, countTokens);

  // Build file → findings lookup tables for efficient access.
  const securityFindingsByFile = createFindingsTable(securityFindings);
  const cveFindingsByFile = createFindingsTable(cveFindings);

  // Small PRs can be reviewed in a single request.
  if (diffChunks.length === 1) {
    const result = await reviewChunk(
      diffChunks[0]!,
      securityFindingsByFile,
      cveFindingsByFile
    );

    return result.reviews;
  }

  // Large PRs are processed concurrently with a limit to avoid overwhelming the LLM provider.
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);
  const chunkResults = await Promise.all(
    diffChunks.map((chunk) =>
      limit(() => reviewChunk(chunk, securityFindingsByFile, cveFindingsByFile))
    )
  );
  const reviews = chunkResults.flatMap((result) => result.reviews);

  return deduplicateReviews(reviews);
}
