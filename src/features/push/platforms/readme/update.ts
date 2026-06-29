const README_API_BASE = "https://dash.readme.com/api/v1";

// Update a ReadMe page with Markdown content.
export async function updateReadMePage(
  slug: string,
  content: string,
  apiKey: string
): Promise<void> {
  const apiUrl = `${README_API_BASE}/docs/${slug}`;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(apiUrl, {
    body: JSON.stringify({
      body: content,
    }),
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error("Failed to update ReadMe page.");
  }
}
