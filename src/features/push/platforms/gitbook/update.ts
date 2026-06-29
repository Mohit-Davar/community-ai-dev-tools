const GITBOOK_API_BASE = "https://api.gitbook.com/v1";

// Update a GitBook page with Markdown content.
export async function updateGitBookPage(
  spaceId: string,
  pageId: string,
  content: string,
  token: string
): Promise<void> {
  const apiUrl = `${GITBOOK_API_BASE}/spaces/${spaceId}/content/${pageId}`;

  const response = await fetch(apiUrl, {
    body: JSON.stringify({
      document: {
        markdown: content,
      },
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error("Failed to update GitBook page.");
  }
}
