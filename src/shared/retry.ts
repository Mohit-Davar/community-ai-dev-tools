import * as core from "@actions/core";
import { type ErrorWithStatus, getConfig } from "@src/shared";
import { DEFAULT_MODEL, openai } from "@src/shared/model";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod/v4";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// Retry only transient API failures.
function isRetryableError(error: unknown): error is ErrorWithStatus {
  return (
    error instanceof Error &&
    "status" in error &&
    RETRYABLE_STATUS_CODES.has((error as ErrorWithStatus).status)
  );
}

// Exponential backoff helper.
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callWithRetry<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  schemaName: string
): Promise<T> {
  const model = getConfig().review?.model || DEFAULT_MODEL;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.responses.parse({
        input: [
          {
            content: systemPrompt,
            role: "system",
          },
          {
            content: userMessage,
            role: "user",
          },
        ],
        model,
        text: {
          format: zodTextFormat(schema, schemaName),
        },
      });
      if (!response.output_parsed) {
        throw new Error("Received an empty structured response from the LLM.");
      }
      return response.output_parsed;
    } catch (error) {
      lastError = error;

      const shouldRetry = isRetryableError(error) && attempt < MAX_RETRIES;
      if (!shouldRetry) {
        throw new Error(`LLM request failed after ${attempt} attempt(s).`, {
          cause: error,
        });
      }

      const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
      core.warning(
        `LLM request failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms.`
      );
      await sleep(delay);
    }
  }

  throw new Error(`LLM request failed after ${MAX_RETRIES} attempts.`, {
    cause: lastError,
  });
}
