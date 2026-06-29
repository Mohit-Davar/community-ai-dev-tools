import * as core from "@actions/core";
import { encodingForModel } from "js-tiktoken";
import OpenAI from "openai";

export const DEFAULT_MODEL = "gpt-5-mini";

export const openai = new OpenAI({
  apiKey: core.getInput("openai-api-key"),
});

// Reuse a single tokenizer instance across all token calculations.
export const tokenizer = encodingForModel(DEFAULT_MODEL);
