import { fetchReadMeContent } from "@src/features/push/platforms/readme/fetch";
import { updateReadMePage } from "@src/features/push/platforms/readme/update";
import type { PlatformHandler } from "@src/features/push/platforms/types";
import type {
  DocumentConfig,
  PlatformCredentials,
  ReadMeDocument,
} from "@src/shared";

export const readmeHandler: PlatformHandler<ReadMeDocument> = {
  checkCredentials: (credentials: PlatformCredentials) => {
    if (!credentials.readme?.apiKey) {
      throw new Error(
        "README_API_KEY not set — cannot perform ReadMe updates."
      );
    }
  },
  fetchContent: (doc: ReadMeDocument, credentials: PlatformCredentials) =>
    fetchReadMeContent(doc.slug, credentials.readme!.apiKey),
  filterDocs: (docs: DocumentConfig[]) =>
    docs.filter((doc): doc is ReadMeDocument => doc.platform === "readme"),
  getDocKey: (doc: ReadMeDocument) => doc.slug,
  name: "ReadMe",
  updateContent: (
    doc: ReadMeDocument,
    content: string,
    credentials: PlatformCredentials
  ) => updateReadMePage(doc.slug, content, credentials.readme!.apiKey),
};
