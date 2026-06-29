import { fetchConfluenceContent } from "@src/features/push/platforms/confluence/fetch";
import { updateConfluencePage } from "@src/features/push/platforms/confluence/update";
import type { PlatformHandler } from "@src/features/push/platforms/types";
import type {
  ConfluenceDocument,
  DocumentConfig,
  PlatformCredentials,
} from "@src/shared";

export const confluenceHandler: PlatformHandler<ConfluenceDocument> = {
  checkCredentials: (credentials: PlatformCredentials) => {
    if (
      !credentials.confluence?.baseUrl ||
      !credentials.confluence?.username ||
      !credentials.confluence?.apiToken
    ) {
      throw new Error("Missing Confluence credentials.");
    }
  },

  fetchContent: (doc: ConfluenceDocument, credentials: PlatformCredentials) => {
    const confluence = credentials.confluence!;
    return fetchConfluenceContent(
      doc.pageId,
      confluence.baseUrl,
      confluence.username,
      confluence.apiToken
    );
  },

  filterDocs: (docs: DocumentConfig[]) =>
    docs.filter(
      (doc): doc is ConfluenceDocument => doc.platform === "confluence"
    ),

  getDocKey: (doc: ConfluenceDocument) => doc.pageId,

  name: "Confluence",

  updateContent: (
    doc: ConfluenceDocument,
    content: string,
    credentials: PlatformCredentials
  ) => {
    const confluence = credentials.confluence!;
    return updateConfluencePage(
      doc.pageId,
      doc.purpose,
      content,
      confluence.baseUrl,
      confluence.username,
      confluence.apiToken
    );
  },
};
