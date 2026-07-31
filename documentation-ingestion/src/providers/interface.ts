/* eslint-disable perfectionist/sort-interfaces */
export interface RawPage {
  // Identity
  externalId: string; // unique key within the collection (e.g. file path or Confluence page ID)
  title: string;
  // Content
  content: string; // plain-text content stored in the DB and indexed for FTS
  // Source location
  sourcePath: string; // human-readable path shown in results (e.g. "guides/setup.md")
  // Relationships
  parentExternalId?: string | null;
  previousExternalId?: string | null;
  nextExternalId?: string | null;
  // Sync metadata
  lastModified?: number; // Unix ms timestamp
}

export interface RawCollection {
  externalId: string;
  name: string;
  pages: RawPage[];
}

export interface IDocProvider {
  /** Matches providers.id in the database */
  readonly providerId: string;
  fetchAll(): Promise<RawCollection[]>;
  fetchUpdated(): Promise<RawCollection[]>;
}
