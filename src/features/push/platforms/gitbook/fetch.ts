const GITBOOK_API_BASE = "https://api.gitbook.com/v1";

// Fetch the current content of a GitBook page.
export async function fetchGitBookContent(
  spaceId: string,
  pageId: string,
  token: string
): Promise<string> {
  const apiUrl = `${GITBOOK_API_BASE}/spaces/${spaceId}/content/page/${pageId}`;
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch GitBook page.");
  }
  const data = (await response.json()) as {
    document?: {
      markdown?: string;
    };
  };
  // Return the page content as Markdown.
  return data.document?.markdown ?? "";
}
