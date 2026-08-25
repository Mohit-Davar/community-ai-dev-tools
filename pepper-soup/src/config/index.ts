import chalk from "chalk";
import "dotenv/config";
import path from "path";
import type { DocType } from "@/types/index";

// Environment
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
if (!OPENAI_API_KEY) {
  console.error(chalk.red.bold("[ERROR] OPENAI_API_KEY is not set. Exiting."));
  process.exit(1);
}
export const PIPELINE_ROOT = path.resolve(process.env.PIPELINE_ROOT ?? "./src");

// Path Helpers
export const confluenceSourcesDir = (featureId: string) =>
  path.join(PIPELINE_ROOT, "sources", featureId, "confluence");
export const excelSourcesDir = (featureId: string) =>
  path.join(PIPELINE_ROOT, "sources", featureId, "excel");
export const codeSourcesDir = (featureId: string) =>
  path.join(PIPELINE_ROOT, "sources", featureId, "code");

export const normalisedDir = (featureId: string) =>
  path.join(PIPELINE_ROOT, "normalised", featureId);

export const kbDir = () => path.join(PIPELINE_ROOT, "knowledge-base");
export const kbFilePath = (featureId: string) =>
  path.join(kbDir(), `${featureId}.json`);

export const gitbookDocsDir = (featureId: string, docType: DocType) =>
  path.join(PIPELINE_ROOT, "docs", featureId, "gitbook", docType);
export const confluenceDocsDir = (featureId: string, docType: DocType) =>
  path.join(PIPELINE_ROOT, "docs", featureId, "confluence", docType);
export const pdfDocsDir = (featureId: string, docType: DocType) =>
  path.join(PIPELINE_ROOT, "docs", featureId, "pdf", docType);

export const reviewDir = () => path.join(PIPELINE_ROOT, "review");
export const reviewFilePath = (featureId: string) =>
  path.join(reviewDir(), `${featureId}.md`);
