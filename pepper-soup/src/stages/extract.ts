import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import pLimit from "p-limit";
import { zodResponseFormat } from "openai/helpers/zod";

import { openai } from "@/llm/client";
import { ExtractedFactsSchema } from "@/llm/schemas";
import {
  markdownBatchExtractionMessages,
  codeBatchExtractionMessages,
} from "@/llm/prompts";
import {
  normalisedDir,
  excelSourcesDir,
  codeSourcesDir,
  OPENAI_MODEL,
} from "@/config";
import {
  listFiles,
  listFilesRecursive,
  makeId,
  readText,
  writeJson,
  slugify,
} from "@/utils/files";
import { summarizeCodeFile } from "@/scripts/extract_code";
import { parseNormalisedMarkdown } from "@/utils/markdown";
import type {
  Fact,
  Example,
  Provenance,
  NormalisedDocMeta,
  ExtractedData,
  BatchItem,
  RawExtractedFact,
  RawExtractedExample,
  ProvenanceWarning,
} from "@/types/index";

const execFileAsync = promisify(execFile);
const TOKEN_BUDGET = 30_000;
const MAX_CONCURRENT_BATCHES = 5;
const CODE_EXTS = [".ts", ".js", ".java", ".tsx", ".jsx", ".rct"];

// Estimate token usage from content length.
function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

// Group items without exceeding the LLM token budget.
function chunkByTokenBudget<T extends { content: string }>(
  items: T[],
  budget: number
): T[][] {
  const batches: T[][] = [];
  let current: T[] = [];
  let used = 0;
  for (const item of items) {
    const tokens = estimateTokens(item.content);
    if (current.length && used + tokens > budget) {
      batches.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += tokens;
  }
  if (current.length) batches.push(current);
  return batches;
}

// Validate required source metadata.
function validateProvenance(p?: Provenance): string[] {
  const problems: string[] = [];
  if (!p) return ["missing provenance"];
  if (!p.source_id) problems.push("missing provenance.source_id");
  if (!p.source_type) problems.push("missing provenance.source_type");
  if (!p.feature_id) problems.push("missing provenance.feature_id");
  return problems;
}

// Match an LLM-reported source to an actual batch item.
function resolveSourceId(
  reported: string | undefined,
  batch: BatchItem[]
): { sourceId: string | null; matched: boolean } {
  if (reported && batch.some((item) => item.sourceId === reported))
    return { sourceId: reported, matched: true };
  // A single-item batch has an unambiguous source.
  if (batch.length === 1)
    return { sourceId: batch[0]!.sourceId, matched: false };
  return { sourceId: null, matched: false };
}

// Convert the raw LLM response into application objects.
function buildExtraction(
  extracted: { facts: unknown[]; examples: unknown[] },
  batch: BatchItem[],
  batchId: string,
  meta: NormalisedDocMeta,
  makeProvenance: (
    sourceId: string,
    resolvedId: string | null,
    section?: string
  ) => Provenance,
  warnings: ProvenanceWarning[]
): ExtractedData {
  const facts: Fact[] = extracted.facts.map((raw, i) => {
    const r = raw as RawExtractedFact;
    const { sourceId, matched } = resolveSourceId(r.source_item_id, batch);
    const finalSourceId = sourceId ?? batchId;
    const provenance = makeProvenance(
      finalSourceId,
      sourceId,
      r.section ?? undefined
    );
    const problems = validateProvenance(provenance);
    if (!matched)
      problems.push("source_item_id unresolved or missing; used fallback");
    if (problems.length)
      warnings.push({ batchId, kind: "fact", index: i, problems });
    return {
      id: makeId(`fact_${finalSourceId}`, i),
      topic: r.topic as Fact["topic"],
      label: r.label,
      content: r.content,
      confidence: r.confidence as Fact["confidence"],
      status: r.status as Fact["status"],
      provenance,
    };
  });
  const examples: Example[] = extracted.examples.map((raw, i) => {
    const r = raw as RawExtractedExample;
    const { sourceId, matched } = resolveSourceId(r.source_item_id, batch);
    const finalSourceId = sourceId ?? batchId;
    const provenance = makeProvenance(
      finalSourceId,
      sourceId,
      r.section ?? undefined
    );
    const problems = validateProvenance(provenance);
    if (!matched)
      problems.push("source_item_id unresolved or missing; used fallback");
    if (problems.length)
      warnings.push({ batchId, kind: "example", index: i, problems });
    return {
      id: makeId(`ex_${finalSourceId}`, i),
      title: r.title,
      scenario: r.scenario,
      steps: r.steps,
      result: r.result,
      provenance,
    };
  });
  return { meta, facts, examples };
}

export async function extractKnowledge(
  featureId: string,
  onProgress?: (msg: string) => void
): Promise<ExtractedData[]> {
  const outputDir = normalisedDir(featureId);
  const results: ExtractedData[] = [];
  const warnings: ProvenanceWarning[] = [];
  // Step 1: Extract knowledge from Markdown.
  onProgress?.("Reading normalised Markdown sources...");
  const markdownItems: BatchItem[] = await Promise.all(
    (await listFiles(outputDir, ".md")).map(async (filePath) => {
      const { meta, body } = parseNormalisedMarkdown(await readText(filePath));
      return { sourceId: meta.source_id, content: body };
    })
  );
  const markdownBatches = chunkByTokenBudget(markdownItems, TOKEN_BUDGET);
  if (markdownBatches.length) {
    onProgress?.(
      `Extracting knowledge from Markdown (${markdownBatches.length} batches)...`
    );
    const limit = pLimit(MAX_CONCURRENT_BATCHES);
    const settled = await Promise.allSettled(
      markdownBatches.map((batch, index) =>
        limit(async () => {
          const batchId = `md_batch_${String(index).padStart(3, "0")}`;
          const meta: NormalisedDocMeta = {
            source_type: "confluence",
            source_id: batchId,
            content_type: "page",
            feature_id: featureId,
            source_url: "",
          };
          // Send Markdown batch to the LLM.
          const completion = await openai.chat.completions.parse({
            model: OPENAI_MODEL,
            messages: markdownBatchExtractionMessages(batch),
            response_format: zodResponseFormat(
              ExtractedFactsSchema,
              "extracted_knowledge"
            ),
          });
          const extracted = completion.choices[0]?.message.parsed;
          if (!extracted)
            throw new Error(`[extract] Batch ${batchId} returned no result.`);
          const extraction = buildExtraction(
            extracted,
            batch,
            batchId,
            meta,
            (sourceId, _resolvedId, section) => ({
              source_type: "confluence",
              source_id: sourceId,
              feature_id: featureId,
              batch_id: batchId,
              section,
            }),
            warnings
          );
          await writeJson(
            path.join(outputDir, `${batchId}.extract.json`),
            extraction
          );
          return extraction;
        })
      )
    );
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
      else onProgress?.(`[extract] Markdown batch failed: ${s.reason}`);
    }
  }
  // Step 2: Extract knowledge from Excel using the Python extractor.
  const excelFiles = await listFiles(excelSourcesDir(featureId), ".xlsx");
  const pythonPath = path.resolve(".venv/Scripts/python.exe");
  const scriptPath = path.resolve("src/scripts/extract_excel.py");
  for (const [i, filePath] of excelFiles.entries()) {
    onProgress?.(
      `Extracting Excel [${i + 1}/${excelFiles.length}]: ${path.basename(filePath)}...`
    );
    try {
      const { stdout } = await execFileAsync(
        pythonPath,
        [scriptPath, featureId, filePath],
        { maxBuffer: 50 * 1024 * 1024 }
      );
      const extractions = JSON.parse(stdout) as ExtractedData[];
      for (const extraction of extractions) {
        // Validate provenance from the Excel extractor.
        extraction.facts.forEach((fact, index) => {
          const problems = validateProvenance(fact.provenance);
          if (problems.length)
            warnings.push({
              batchId: extraction.meta.source_id,
              kind: "fact",
              index,
              problems,
            });
        });
        extraction.examples.forEach((example, index) => {
          const problems = validateProvenance(example.provenance);
          if (problems.length)
            warnings.push({
              batchId: extraction.meta.source_id,
              kind: "example",
              index,
              problems,
            });
        });
        await writeJson(
          path.join(outputDir, `${extraction.meta.source_id}.extract.json`),
          extraction
        );
        results.push(extraction);
      }
    } catch (error) {
      onProgress?.(
        `[extract] Excel extraction failed for "${filePath}": ${error}`
      );
    }
  }
  // Step 3: Extract knowledge from source code.
  const codeDir = codeSourcesDir(featureId);
  onProgress?.("Discovering code source files...");
  const codeFiles = (
    await Promise.all(CODE_EXTS.map((ext) => listFilesRecursive(codeDir, ext)))
  ).flat();
  if (codeFiles.length) {
    onProgress?.(
      `Summarizing ${codeFiles.length} code files with AST analysis...`
    );
    // Reduce code before sending it to the LLM.
    const codeItems: BatchItem[] = await Promise.all(
      codeFiles.map(async (filePath) => ({
        sourceId: slugify(path.relative(codeDir, filePath).replace(/\\/g, "/")),
        content: await summarizeCodeFile(filePath),
      }))
    );
    const codeBatches = chunkByTokenBudget(codeItems, TOKEN_BUDGET);
    onProgress?.(
      `Extracting knowledge from code (${codeBatches.length} batches)...`
    );
    const limit = pLimit(MAX_CONCURRENT_BATCHES);
    const settled = await Promise.allSettled(
      codeBatches.map((batch, index) =>
        limit(async () => {
          const batchId = `code_batch_${String(index).padStart(3, "0")}`;
          const meta: NormalisedDocMeta = {
            source_type: "code",
            source_id: batchId,
            content_type: "source_code",
            feature_id: featureId,
          };
          // Send code batch to the LLM.
          const completion = await openai.chat.completions.parse({
            model: OPENAI_MODEL,
            messages: codeBatchExtractionMessages(featureId, batch),
            response_format: zodResponseFormat(
              ExtractedFactsSchema,
              "extracted_knowledge"
            ),
          });
          const extracted = completion.choices[0]?.message.parsed;
          if (!extracted)
            throw new Error(`[extract] Batch ${batchId} returned no result.`);
          const extraction = buildExtraction(
            extracted,
            batch,
            batchId,
            meta,
            (sourceId, resolvedId, section) => ({
              source_type: "code",
              source_id: sourceId,
              feature_id: featureId,
              batch_id: batchId,
              file_path: resolvedId ?? undefined,
              section,
            }),
            warnings
          );
          await writeJson(
            path.join(outputDir, `${batchId}.extract.json`),
            extraction
          );
          return extraction;
        })
      )
    );
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
      else onProgress?.(`[extract] Code batch failed: ${s.reason}`);
    }
  }
  // Save unresolved provenance for review.
  if (warnings.length) {
    onProgress?.(`[extract] ${warnings.length} provenance warnings found.`);
    await writeJson(
      path.join(outputDir, "_provenance_warnings.json"),
      warnings
    );
  }
  return results;
}
