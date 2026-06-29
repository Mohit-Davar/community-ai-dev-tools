// Fetch the current content of a Confluence page.
export async function fetchConfluenceContent(
  pageId: string,
  baseUrl: string,
  username: string,
  apiToken: string
): Promise<string> {
  const apiUrl = `${baseUrl.replace(/\/$/, "")}/wiki/rest/api/content/${pageId}?expand=body.storage`;
  const auth = Buffer.from(`${username}:${apiToken}`).toString("base64");

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Confluence page.");
  }

  const data = (await response.json()) as {
    body?: {
      storage?: {
        value?: string;
      };
    };
  };

  // Return the page content in Confluence storage format.
  return data.body?.storage?.value ?? "";
}
