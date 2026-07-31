import { confluenceGet, fetchAllCursor } from "./client.ts";

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
}

export interface ConfluencePage {
  _links: {
    webui: string;
  };
  body?: {
    storage?: {
      representation: string;
      value: string;
    };
  };
  createdAt: string;
  id: string;
  parentId: string | null;
  spaceId: string;
  status: string;
  title: string;
  version: {
    createdAt: string;
    number: number;
  };
}

export interface ConfluenceAttachment {
  _links: {
    download: string;
  };
  fileId: string;
  id: string;
  title: string;
}

export async function fetchSpaces(): Promise<ConfluenceSpace[]> {
  return fetchAllCursor<ConfluenceSpace>("/wiki/api/v2/spaces?limit=50");
}

export async function fetchPagesInSpace(
  spaceId: string
): Promise<ConfluencePage[]> {
  return fetchAllCursor<ConfluencePage>(
    `/wiki/api/v2/spaces/${spaceId}/pages?limit=50`
  );
}

export async function fetchPageWithBody(
  pageId: string
): Promise<ConfluencePage> {
  return confluenceGet<ConfluencePage>(
    `/wiki/api/v2/pages/${pageId}?body-format=storage`
  );
}

export async function fetchPageAttachments(
  pageId: string
): Promise<ConfluenceAttachment[]> {
  return fetchAllCursor<ConfluenceAttachment>(
    `/wiki/api/v2/pages/${pageId}/attachments`
  );
}
