import type { DocumentConfig, PlatformCredentials } from "@src/shared";

export interface PlatformHandler<TDoc extends DocumentConfig> {
  checkCredentials: (credentials: PlatformCredentials) => void;
  fetchContent: (
    doc: TDoc,
    credentials: PlatformCredentials
  ) => Promise<string>;
  filterDocs: (docs: DocumentConfig[]) => TDoc[];
  getDocKey: (doc: TDoc) => string;
  name: string;
  updateContent: (
    doc: TDoc,
    content: string,
    credentials: PlatformCredentials
  ) => Promise<void>;
}

export interface SelectableDocument {
  key: string;
  purpose: string;
}
