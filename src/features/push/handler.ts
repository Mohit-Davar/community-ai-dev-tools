import * as core from "@actions/core";
import { detectAudiences } from "@src/features/push/audience";
import { getPushDiff } from "@src/features/push/git-diff";
import { publishToAllPlatforms } from "@src/features/push/platforms";
import type { PlatformCredentials } from "@src/shared";
import { expectError, getConfig } from "@src/shared";

export async function handlePushEvent({
  after,
  before,
  credentials,
  owner,
  repo,
  token,
}: {
  after: string;
  before: string;
  credentials: PlatformCredentials;
  owner: string;
  repo: string;
  token: string;
}) {
  // Collect changed files and diff
  const [diffError, pushChanges] = await expectError(
    getPushDiff(token, owner, repo, before, after)
  );
  if (diffError) {
    throw new Error(
      `Failed to retrieve repository changes between ${before} and ${after}`,
      { cause: diffError }
    );
  }
  if (pushChanges.changedFiles.length === 0) {
    core.info(
      "No file changes detected in this push. Skipping documentation analysis."
    );
    return;
  }

  // Determine affected audiences via LLM
  const [audienceError, audiences] = await expectError(
    detectAudiences(pushChanges)
  );
  if (audienceError) {
    throw new Error(
      "Failed to determine which documentation audiences are affected by the repository changes.",
      { cause: audienceError }
    );
  }
  if (audiences.length === 0) {
    core.info(
      "No affected documentation audiences detected. Skipping documentation updates."
    );
    return;
  }

  // Load configured documentation targets.
  const documents = getConfig().documentation?.documents ?? [];
  if (documents.length === 0) {
    core.info(
      "No documentation targets configured. Skipping documentation updates."
    );
    return;
  }
  const [publishError] = await expectError(
    publishToAllPlatforms(documents, pushChanges, audiences, credentials)
  );
  if (publishError) {
    throw new Error(
      "Failed to publish documentation updates to one or more platforms.",
      { cause: publishError }
    );
  }
}
