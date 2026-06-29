import type { DiffChunk } from "@src/shared/git-diff/types";

export const MAX_TOKENS_PER_CHUNK = 10000;
export const MAX_CONCURRENT_CHUNKS = 3;

// Split diffs into chunks that fit within the model's context window.
export function chunkDiffs<T>(
  items: T[],
  getTokenCount: (item: T) => number,
  maxTokens: number = MAX_TOKENS_PER_CHUNK
): DiffChunk<T>[] {
  const chunks: T[][] = [];
  let currentChunk: T[] = [];
  let currentChunkTokens = 0;

  for (const item of items) {
    const itemTokens = getTokenCount(item);
    const wouldExceedLimit =
      currentChunk.length > 0 && currentChunkTokens + itemTokens > maxTokens;
    if (wouldExceedLimit) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkTokens = 0;
    }
    currentChunk.push(item);
    currentChunkTokens += itemTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const result: DiffChunk<T>[] = [];
  let chunkIndex = 0;
  for (const chunk of chunks) {
    result.push({
      chunkIndex,
      diffs: chunk,
      totalChunks: chunks.length,
    });
    chunkIndex++;
  }

  return result;
}
