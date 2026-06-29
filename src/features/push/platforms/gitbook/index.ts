import { fetchGitBookContent } from "@src/features/push/platforms/gitbook/fetch";
import { updateGitBookPage } from "@src/features/push/platforms/gitbook/update";
import type { PlatformHandler } from "@src/features/push/platforms/types";
import type {
  DocumentConfig,
  GitBookDocument,
  PlatformCredentials,
} from "@src/shared";

export const gitbookHandler: PlatformHandler<GitBookDocument> = {
  checkCredentials: (credentials: PlatformCredentials) => {
    if (!credentials.gitbook?.token) {
      throw new Error("Missing GitBook token.");
    }
    if (!process.env["GITBOOK_SPACE_ID"]) {
      throw new Error("Missing GitBook space ID.");
    }
  },

  fetchContent: (doc: GitBookDocument, credentials: PlatformCredentials) => {
    const spaceId = process.env["GITBOOK_SPACE_ID"]!;
    const token = credentials.gitbook!.token;
    return fetchGitBookContent(spaceId, doc.id, token);
  },

  filterDocs: (docs: DocumentConfig[]) =>
    docs.filter((doc): doc is GitBookDocument => doc.platform === "gitbook"),

  getDocKey: (doc: GitBookDocument) => doc.id,

  name: "GitBook",

  updateContent: (
    doc: GitBookDocument,
    content: string,
    credentials: PlatformCredentials
  ) => {
    const spaceId = process.env["GITBOOK_SPACE_ID"]!;
    const token = credentials.gitbook!.token;
    return updateGitBookPage(spaceId, doc.id, content, token);
  },
};
