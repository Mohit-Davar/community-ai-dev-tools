// Update a Confluence page with Markdown content.
export async function updateConfluencePage(
  pageId: string,
  title: string,
  content: string,
  baseUrl: string,
  username: string,
  apiToken: string
): Promise<void> {
  const apiBaseUrl = `${baseUrl.replace(/\/$/, "")}/wiki/rest/api/content`;
  const auth = Buffer.from(`${username}:${apiToken}`).toString("base64");

  // Fetch the current page version.
  const versionResponse = await fetch(
    `${apiBaseUrl}/${pageId}?expand=version`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    }
  );
  if (!versionResponse.ok) {
    throw new Error("Failed to fetch Confluence page version.");
  }
  const versionData = (await versionResponse.json()) as {
    version?: {
      number?: number;
    };
  };
  const currentVersion = versionData.version?.number ?? 1;

  // Wrap the Markdown in a Confluence markdown macro.
  const storageValue = `<ac:structured-macro ac:name="markdown" ac:schema-version="1">
  <ac:plain-text-body><![CDATA[${content}]]></ac:plain-text-body>
</ac:structured-macro>`;
  const updateResponse = await fetch(`${apiBaseUrl}/${pageId}`, {
    body: JSON.stringify({
      body: {
        storage: {
          representation: "storage",
          value: storageValue,
        },
      },
      title,
      type: "page",
      version: {
        number: currentVersion + 1,
      },
    }),
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
  if (!updateResponse.ok) {
    throw new Error("Failed to update Confluence page.");
  }
}
