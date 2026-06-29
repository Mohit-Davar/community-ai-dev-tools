const README_API_BASE = "https://dash.readme.com/api/v1";

// Fetch the current content of a ReadMe page.
export async function fetchReadMeContent(
  slug: string,
  apiKey: string
): Promise<string> {
  const apiUrl = `${README_API_BASE}/docs/${slug}`;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch ReadMe page.");
  }

  const data = (await response.json()) as {
    body?: string;
  };
  // Return the page content as Markdown.
  return data.body ?? "";
}
