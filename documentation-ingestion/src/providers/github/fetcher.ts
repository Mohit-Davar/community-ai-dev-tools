import { getOctokit } from "@/providers/github/client";
import type { ChangedFile, TreeItem } from "@/providers/github/types";

export async function fetchRepoTree(
  owner: string,
  repo: string,
  ref = "main"
): Promise<TreeItem[]> {
  const octokit = getOctokit();

  const { data: commit } = await octokit.rest.repos.getCommit({
    owner,
    ref,
    repo,
  });

  const { data: tree } = await octokit.rest.git.getTree({
    owner,
    recursive: "1",
    repo,
    tree_sha: commit.commit.tree.sha,
  });

  return tree.tree as TreeItem[];
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const octokit = getOctokit();

  const { data } = await octokit.rest.repos.getContent({
    owner,
    path,
    ref,
    repo,
  });
  if (Array.isArray(data) || data.type !== "file" || !data.content) {
    throw new Error(`Path "${path}" is not a file or has no content.`);
  }

  return Buffer.from(data.content, "base64").toString("utf8");
}

export async function fetchChangedFiles(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<ChangedFile[]> {
  const octokit = getOctokit();

  const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
    basehead: `${base}...${head}`,
    owner,
    repo,
  });

  return (data.files ?? []).map((file) => ({
    filename: file.filename,
    sha: file.sha,
    status: file.status as ChangedFile["status"],
  }));
}
