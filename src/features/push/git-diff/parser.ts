import { getOctokit } from "@actions/github";
import type { PushChanges } from "@src/features/push/git-diff";
import { isIgnoredFile, matchesScanPatterns } from "@src/shared";

// Fetch all repository changes introduced between two commits.
export async function getPushDiff(
  token: string,
  owner: string,
  repo: string,
  before: string,
  after: string
): Promise<PushChanges> {
  const octokit = getOctokit(token);

  // GitHub compare returns all commits and file changes between the before and after SHAs.
  const comparison = await octokit.rest.repos.compareCommitsWithBasehead({
    basehead: `${before}...${after}`,
    owner,
    repo,
  });

  // This excludes ignored files and files outside configured scan patterns.
  const relevantFiles = (comparison.data.files ?? []).filter(
    (file) =>
      matchesScanPatterns(file.filename) && !isIgnoredFile(file.filename)
  );

  // File paths are useful for reporting and LLM context.
  const changedFiles = relevantFiles.map((file) => file.filename);

  // Commit messages help provide additional context about the intent of the changes.
  const commitMessages = comparison.data.commits.map(
    (commit) => commit.commit.message
  );

  // Store structured file-level changes so downstream features can reason about additions, removals, and edits.
  const fileChanges = relevantFiles.map((file) => ({
    changeType: file.status,
    diff: file.patch ?? "",
    path: file.filename,
  }));

  return {
    changedFiles,
    commitMessages,
    fileChanges,
  };
}
