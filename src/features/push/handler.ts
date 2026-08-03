import * as core from "@actions/core";
import { generateDocumentEdits } from "@src/features/push/generator";
import { publishDocumentUpdate } from "@src/features/push/publisher";
import { retrieveDocumentContent } from "@src/features/push/retriever";
import { selectDocuments } from "@src/features/push/select-documents";
import type { ProcessResult } from "@src/features/push/types";
import { validateEdits } from "@src/features/push/validator";
import {
  expectError,
  getConfig,
  getPRContext,
  type PlatformCredentials,
} from "@src/shared";
import pLimit from "p-limit";

const limit = pLimit(3);

/**
 * Orchestrates the entire documentation update workflow.
 * This function coordinates the process of collecting PR context, selecting relevant documents,
 * generating edits, validating them, and finally publishing the updates.
 *
 * @param params - The parameters required for the workflow.
 * @param params.credentials - Credentials for accessing documentation platforms.
 * @param params.owner - The owner of the repository.
 * @param params.prNumber - The pull request number.
 * @param params.repo - The repository name.
 * @param params.token - The GitHub token for the code repository.
 */
export async function handleMerge({
  credentials,
  owner,
  prNumber,
  repo,
  token,
}: {
  credentials: PlatformCredentials;
  owner: string;
  prNumber: number;
  repo: string;
  token: string;
}) {
  // Collect context from the pull request, including diff, commits, and metadata.
  const [contextError, prContext] = await expectError(
    getPRContext({
      owner,
      prNumber,
      repo,
      token,
    })
  );
  if (contextError) {
    throw new Error("Failed to collect pull request context", {
      cause: contextError,
    });
  }

  // Load documentation sources from the configuration file.
  const sources = getConfig().documentation?.documents;
  if (!sources?.length) {
    core.info("No documentation sources configured.");
    return;
  }

  // Use an LLM to select which documents are relevant to the merged changes.
  const [selectionError, selectedDocs] = await expectError(
    selectDocuments(prContext, sources, credentials)
  );
  if (selectionError) {
    throw new Error("Failed to select relevant documents.", {
      cause: selectionError,
    });
  }
  if (!selectedDocs.length) {
    core.info("No documentation updates required.");
    return;
  }

  const results = await Promise.all(
    selectedDocs.map((doc) =>
      limit(async (): Promise<ProcessResult> => {
        try {
          // Retrieve current document.
          const [retrievalError, currentContent] = await expectError(
            retrieveDocumentContent(doc, credentials)
          );
          if (retrievalError) {
            throw new Error(`Failed to retrieve "${doc.path}".`, {
              cause: retrievalError,
            });
          }

          // Generate edits.
          const [generationError, edits] = await expectError(
            generateDocumentEdits(prContext, currentContent)
          );
          if (generationError) {
            throw new Error(`Failed to generate edits for "${doc.path}".`, {
              cause: generationError,
            });
          }
          if (!edits.length) {
            return {
              doc,
              reason: "No edits were generated.",
              status: "skipped",
            };
          }

          // Validate edits.
          const validation = validateEdits(
            currentContent,
            edits,
            prContext.diff
          );
          if (!validation.isValid || !validation.updatedContent) {
            return {
              doc,
              reason: validation.reason,
              status: "skipped",
            };
          }

          // Publish.
          const [publishError, url] = await expectError(
            publishDocumentUpdate({
              codeOwner: owner,
              codePrNumber: prNumber,
              codeRepo: repo,
              codeToken: token,
              credentials,
              routedDoc: doc,
              updatedContent: validation.updatedContent,
            })
          );
          if (publishError) {
            throw new Error(`Failed to publish "${doc.path}".`, {
              cause: publishError,
            });
          }
          return {
            doc,
            status: "published",
            url,
          };
        } catch (error) {
          return {
            doc,
            error: error as Error,
            status: "failed",
          };
        }
      })
    )
  );
  const failed = results.filter(
    (result): result is Extract<ProcessResult, { status: "failed" }> =>
      result.status === "failed"
  );
  if (failed.length) {
    core.error(`Documentation update failed for ${failed.length} document(s).`);
    for (const { doc, error } of failed) {
      core.error(`Document: ${doc.path}`);
      core.error(`Error: ${error.message}`);
      let cause: unknown = error;
      let depth = 0;
      while (cause instanceof Error) {
        if (depth > 0) {
          core.error(`Cause ${depth}: ${cause.message}`);
        }
        if (cause.stack) {
          core.error(cause.stack);
        }
        cause = cause.cause;
        depth++;
      }
    }
  }
}
