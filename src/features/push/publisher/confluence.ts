import { getOctokit } from "@actions/github";

/**
 * Publishes a Confluence documentation update by posting a comment on the source pull request.
 * This approach is designed to be non-intrusive, suggesting changes rather than overwriting
 * enterprise wikis directly. It provides the updated content in a code block for easy review and manual application.
 *
 * @param params - The parameters for publishing the Confluence update suggestion.
 * @param params.codeOwner - The owner of the code repository.
 * @param params.codePrNumber - The number of the pull request where changes originated.
 * @param params.codeRepo - The name of the code repository.
 * @param params.codeToken - The GitHub token for accessing the code repository.
 * @param params.confluenceBaseUrl - The base URL of the Confluence instance.
 * @param params.pageId - The ID of the Confluence page to be updated.
 * @param params.reason - The reason the document was selected for an update.
 * @param params.updatedContent - The new, updated content for the Confluence page.
 * @returns A promise that resolves to the URL of the created comment.
 */
export async function publishConfluenceUpdate({
  codeOwner,
  codePrNumber,
  codeRepo,
  codeToken,
  confluenceBaseUrl,
  pageId,
  reason,
  updatedContent,
}: {
  codeOwner: string;
  codePrNumber: number;
  codeRepo: string;
  codeToken: string;
  confluenceBaseUrl: string;
  pageId: string;
  reason: string;
  updatedContent: string;
}): Promise<string> {
  const codeOctokit = getOctokit(codeToken);
  const normalizedBaseUrl = confluenceBaseUrl.replace(/\/$/, "");
  const confluencePageUrl = `${normalizedBaseUrl}/wiki/pages/viewpage.action?pageId=${pageId}`;

  const commentBody = [
    `# 📝 Documentation update suggested`,
    ``,
    `> **Note**  `,
    `> Triggered by [PR #${codePrNumber}](https://github.com/${codeOwner}/${codeRepo}/pull/${codePrNumber}) in **${codeOwner}/${codeRepo}**.`,
    ``,
    `### 📍 Reference Details`,
    `| Property | Value |`,
    `| :--- | :--- |`,
    `| **Confluence Page** | [📄 Page ID: ${pageId}](${confluencePageUrl}) |`,
    `| **Reason** | ${reason} |`,
    ``,
    `### 🛠️ Proposed Content`,
    `<details>`,
    `<summary><strong>Click to expand suggested source code</strong></summary>`,
    ``,
    `\`\`\`html`,
    updatedContent,
    `\`\`\``,
    `</details>`,
    ``,
    `### 🚀 Next Steps`,
    `1. Review the proposed content above.`,
    `2. Open the [Confluence page](${confluencePageUrl}).`,
    `3. Edit the page and apply the changes (or copy-paste the block directly into the page editor).`,
    ``,
    `---`,
    `*Opened automatically by **RepoOwl**.*`,
  ].join("\n");

  const { data: commentResponse } = await codeOctokit.rest.issues.createComment(
    {
      body: commentBody,
      issue_number: codePrNumber,
      owner: codeOwner,
      repo: codeRepo,
    }
  );

  return commentResponse.html_url;
}
