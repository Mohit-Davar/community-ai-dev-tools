import { env } from "@/lib/env.ts";

function getAuthHeader(): string {
  if (!env.CONFLUENCE_EMAIL || !env.CONFLUENCE_API_TOKEN) {
    throw new Error("CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN must be set");
  }
  return (
    "Basic " +
    Buffer.from(`${env.CONFLUENCE_EMAIL}:${env.CONFLUENCE_API_TOKEN}`).toString(
      "base64"
    )
  );
}

export async function confluenceGet<T>(path: string): Promise<T> {
  if (!env.CONFLUENCE_BASE_URL) {
    throw new Error("CONFLUENCE_BASE_URL must be set");
  }

  const url = new URL(path, env.CONFLUENCE_BASE_URL).toString();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Confluence API error ${response.status} ${response.statusText} for ${url}`
    );
  }

  return response.json() as Promise<T>;
}

interface CursorResponse<T> {
  _links?: { next?: string };
  results?: T[];
}

export async function fetchAllCursor<T>(initialPath: string): Promise<T[]> {
  const results: T[] = [];
  let currentPath: string | undefined = initialPath;

  while (currentPath) {
    const data = await confluenceGet<CursorResponse<T>>(currentPath);

    if (Array.isArray(data.results)) {
      results.push(...data.results);
    }

    currentPath = data._links?.next;
  }

  return results;
}
