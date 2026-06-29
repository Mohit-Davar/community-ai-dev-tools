import * as core from "@actions/core";
import {
  AudienceDetectionSchema,
  SYSTEM_PROMPT,
} from "@src/features/push/audience";
import type { ChangedFile, PushChanges } from "@src/features/push/git-diff";
import type { DocAudience } from "@src/shared";
import { chunkDiffs, MAX_CONCURRENT_CHUNKS, tokenizer } from "@src/shared";
import { callWithRetry } from "@src/shared/retry";
import pLimit from "p-limit";

function countTokens(file: ChangedFile) {
  return tokenizer.encode(`FILE ${file.path}\n${file.diff}`).length;
}

export async function detectAudiences(
  pushChanges: PushChanges
): Promise<DocAudience[]> {
  // Estimate token usage so large pushes can be split into multiple LLM requests.
  const diffChunks = chunkDiffs(pushChanges.fileChanges, countTokens);
  const audiences = new Set<DocAudience>();
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);
  const chunkResults = await Promise.all(
    diffChunks.map((chunk) =>
      limit(async () => {
        const diffText = chunk.diffs
          .map((file) => `FILE ${file.path}\n${file.diff}`)
          .join("\n\n");
        return callWithRetry(
          SYSTEM_PROMPT,
          diffText,
          AudienceDetectionSchema,
          "audience_detection"
        );
      })
    )
  );

  for (const result of chunkResults) {
    if (result.user) {
      audiences.add("user");
    }
    if (result.implementor) {
      audiences.add("implementor");
    }
    if (result.developer) {
      audiences.add("developer");
    }
  }

  const detectedAudiences = [...audiences];
  core.info(
    `Detected audiences: ${
      detectedAudiences.length > 0 ? detectedAudiences.join(", ") : "none"
    }`
  );

  return detectedAudiences;
}
