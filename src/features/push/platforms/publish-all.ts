import * as core from "@actions/core";
import type { PushChanges } from "@src/features/push/git-diff";
import {
  confluenceHandler,
  gitbookHandler,
  readmeHandler,
} from "@src/features/push/platforms";
import { generateDocUpdate } from "@src/features/push/platforms/generate-doc-update";
import { selectDocuments } from "@src/features/push/platforms/select-documents";
import type { PlatformHandler } from "@src/features/push/platforms/types";
import type {
  DocAudience,
  DocumentConfig,
  PlatformCredentials,
} from "@src/shared";
import { expectError, MAX_CONCURRENT_CHUNKS } from "@src/shared";
import pLimit from "p-limit";

// All supported documentation platforms.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers: PlatformHandler<any>[] = [
  gitbookHandler,
  readmeHandler,
  confluenceHandler,
];

// Publish documentation updates for every audience across all configured platforms.
export async function publishToAllPlatforms(
  documents: DocumentConfig[],
  pushChanges: PushChanges,
  audiences: DocAudience[],
  credentials: PlatformCredentials
): Promise<void> {
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);

  const updates = audiences.flatMap((audience) =>
    handlers.map(async (handler) => {
      const platformDocs = handler.filterDocs(documents);
      if (platformDocs.length === 0) {
        return;
      }

      handler.checkCredentials(credentials);

      const selectableDocs = platformDocs.map((doc) => ({
        key: handler.getDocKey(doc),
        purpose: doc.purpose,
      }));

      const [selectionError, selectedKeys] = await expectError(
        selectDocuments(selectableDocs, pushChanges, audience)
      );

      if (selectionError) {
        throw new Error(`Failed to select documents for ${handler.name}.`, {
          cause: selectionError,
        });
      }

      if (selectedKeys.length === 0) {
        core.info(
          `No documents require updates for ${handler.name} (${audience}).`
        );
        return;
      }

      const selectedDocs = platformDocs.filter((doc) =>
        selectedKeys.includes(handler.getDocKey(doc))
      );

      await Promise.all(
        selectedDocs.map((doc) =>
          limit(async () => {
            const docKey = handler.getDocKey(doc);
            core.info(
              `Updating ${handler.name} page "${docKey}" (${audience})…`
            );

            const [fetchError, existingContent] = await expectError(
              handler.fetchContent(doc, credentials)
            );
            if (fetchError) {
              throw new Error(
                `Failed to fetch document "${docKey}" from ${handler.name}.`,
                {
                  cause: fetchError,
                }
              );
            }

            const [generateError, updatedContent] = await expectError(
              generateDocUpdate(
                existingContent,
                pushChanges,
                audience,
                doc.purpose
              )
            );
            if (generateError) {
              throw new Error(
                `Failed to generate documentation update for "${docKey}" in ${handler.name}.`,
                {
                  cause: generateError,
                }
              );
            }
            if (!updatedContent) {
              core.info(
                `No update required for ${handler.name} page "${docKey}" (${audience}).`
              );
              return;
            }

            const [updateError] = await expectError(
              handler.updateContent(doc, updatedContent, credentials)
            );
            if (updateError) {
              throw new Error(
                `Failed to publish document "${docKey}" to ${handler.name}.`,
                {
                  cause: updateError,
                }
              );
            }

            core.info(
              `Successfully updated ${handler.name} page "${docKey}" (${audience}).`
            );
          })
        )
      );
    })
  );

  await Promise.all(updates);
}
