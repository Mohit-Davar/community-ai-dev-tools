/**
 * Extracts structured knowledge from every source belonging to a feature.
 *
 * Each source is processed independently and produces its own `<source>.extract.json` file.
 * Returns all extracted knowledge in memory in addition to writing per-source artifacts to disk.
 */

import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/llm/client";
import { ExtractedFactsSchema } from "@/llm/schemas";
import { knowledgeExtractionMessages } from "@/llm/prompts";
import { normalisedDir, excelSourcesDir, OPENAI_MODEL } from "@/config";
import { listFiles, makeId, readText, writeJson } from "@/utils/files";
import { parseNormalisedMarkdown } from "@/utils/markdown";
import type { Fact, Example, Provenance, NormalisedDocMeta } from "@/types";

const execFileAsync = promisify(execFile);

interface ExtractedData {
  meta: NormalisedDocMeta;
  facts: Fact[];
  examples: Example[];
}

export async function extractKnowledge(
  featureId: string
): Promise<ExtractedData[]> {
  const processedDirectory = normalisedDir(featureId);
  const results: ExtractedData[] = [];

  // Process Markdown Sources
  const markdownFiles = await listFiles(processedDirectory, ".md");
  let totalInformationItems = 0;
  for (const filePath of markdownFiles) {
    const fileText = await readText(filePath);
    const { meta, body } = parseNormalisedMarkdown(fileText);
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: knowledgeExtractionMessages(body, meta.source_id),
      response_format: zodResponseFormat(
        ExtractedFactsSchema,
        "extracted_knowledge"
      ),
    });
    const extractedResult = completion.choices[0]?.message.parsed;
    if (!extractedResult) {
      throw new Error(
        `[extract] Failed to extract knowledge from "${meta.source_id}".`
      );
    }
    const provenance: Provenance = {
      source_type: meta.source_type,
      source_id: meta.source_id,
      feature_id: meta.feature_id,
    };
    const extraction: ExtractedData = {
      meta,
      facts: extractedResult.facts.map((fact, i) => ({
        ...fact,
        id: makeId(`fact_${meta.source_id}`, totalInformationItems + i),
        provenance,
      })),
      examples: extractedResult.examples.map((example, i) => ({
        ...example,
        id: makeId(`ex_${meta.source_id}`, i),
        provenance,
      })),
    };
    totalInformationItems += extraction.facts.length;
    await writeJson(
      path.join(
        processedDirectory,
        `${path.basename(filePath, ".md")}.extract.json`
      ),
      extraction
    );
    results.push(extraction);
  }

  // Process Excel Sources
  const excelFiles = await listFiles(excelSourcesDir(featureId), ".xlsx");
  const pythonPath = path.resolve(".venv/Scripts/python.exe");
  const scriptPath = path.resolve("src/scripts/extract_excel.py");
  for (const filePath of excelFiles) {
    try {
      const { stdout } = await execFileAsync(
        pythonPath,
        [scriptPath, featureId, filePath],
        { maxBuffer: 50 * 1024 * 1024 }
      );
      const extractedSources = JSON.parse(stdout) as ExtractedData[];
      for (const source of extractedSources) {
        await writeJson(
          path.join(
            processedDirectory,
            `${source.meta.source_id}.extract.json`
          ),
          source
        );
        results.push(source);
      }
    } catch (error) {
      throw new Error(
        `[extract] Failed to extract knowledge from "${filePath}": ${error}`
      );
    }
  }

  return results;
}
