import type { ChangedFile, PushChanges } from "@src/features/push/git-diff";
import type { DocAudience } from "@src/shared";
import { callWithRetry, chunkDiffs, tokenizer } from "@src/shared";
import { z } from "zod/v4";

// Response schema for the documentation update.
const DocUpdateSchema = z.object({
  content: z
    .string()
    .describe(
      "The updated documentation in Markdown. Return an empty string if no update is required."
    ),
});

/**
 * Build the system prompt for the target audience.
 */
function buildSystemPrompt(audience: DocAudience): string {
  let audienceName: string;
  let audienceGuidance: string;

  if (audience === "user") {
    audienceName = "end user";
    audienceGuidance = `
Focus on user-facing changes. Use plain language.
Highlight new features, behavior changes, bug fixes, and anything that affects the user experience.
Avoid implementation details.`;
  } else {
    audienceName = "developer";
    audienceGuidance = `
Focus on API changes, configuration updates, migration steps, interface changes, and architecture decisions.
Include technical details relevant to developers.`;
  }

  return `
You are a technical writer updating documentation for the ${audienceName} audience.

${audienceGuidance}

Instructions:
- Write in Markdown only.
- Update the existing document instead of rewriting it.
- Only include changes introduced by this push.
- Do not repeat unchanged content.
- Return an empty "content" value if no update is needed.
`.trim();
}

function countTokens(file: ChangedFile) {
  return tokenizer.encode(`FILE ${file.path}\n${file.diff}`).length;
}

/**
 * Generate an updated version of a documentation page.
 */
export async function generateDocUpdate(
  existingContent: string,
  pushChanges: PushChanges,
  audience: DocAudience,
  documentDescription: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(audience);

  const diffChunks = chunkDiffs(pushChanges.fileChanges, countTokens);
  let currentContent = existingContent;

  for (const chunk of diffChunks) {
    const diffText = chunk.diffs
      .map((file) => `FILE ${file.path}\n${file.diff}`)
      .join("\n\n");

    const prompt = [
      `Document: ${documentDescription}`,
      `Audience: ${audience}`,
      `Existing content:\n${currentContent}`,
      `Changed files:\n${pushChanges.changedFiles.join("\n")}`,
      `Diff:\n${diffText}`,
    ].join("\n\n");

    const result = await callWithRetry(
      systemPrompt,
      prompt,
      DocUpdateSchema,
      "doc_update"
    );

    const output = result.content.trim();
    if (output) {
      currentContent = output;
    }
  }

  return currentContent !== existingContent ? currentContent : "";
}
