import { createHash } from "crypto";

import type { RawPage } from "@/providers/interface.ts";

export interface NormalizedPage {
  audience_id: string | null;
  collection_id: string;
  content: string | null;
  id: string; // sha256(sourceId + ':' + externalId).hex.slice(0, 16)
  last_modified: number | null;
  source_path: string;
  title: string;
}

export function generatePageId(sourceId: string, externalId: string): string {
  const hash = createHash("sha256");
  hash.update(`${sourceId}:${externalId}`);
  return hash.digest("hex").slice(0, 16);
}

export function normalisePage(
  sourceId: string,
  collectionId: string,
  rawPage: RawPage,
  audienceId: string | null = null
): NormalizedPage {
  return {
    audience_id: audienceId,
    collection_id: collectionId,
    content: rawPage.content || null,
    id: generatePageId(sourceId, rawPage.externalId),
    last_modified: rawPage.lastModified ?? null,
    source_path: rawPage.sourcePath,
    title: rawPage.title,
  };
}
