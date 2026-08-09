/**
 * Merge Knowledge
 *
 * Reads all per-source extraction JSON files and merges them into a single
 * FeatureKnowledgeBase JSON file at pipeline/knowledge-base/<featureId>.json.
 *
 * Merge strategy:
 * - All facts are collected and assigned unique IDs
 * - Near-duplicate facts (same label + topic) are flagged (kept, but status noted)
 * - Conflicting facts remain separate with status = "conflicting"
 * - Open questions are surfaced separately for easy access
 */

import { normalisedDir, kbFilePath, kbDir } from "@/config/index";
import { listFiles, readJson, writeJson, ensureDir } from "@/utils/files";
import { makeId } from "@/utils/files";
import type { Fact, Example, FeatureKnowledgeBase } from "@/types/index";

interface ExtractedData {
  meta: { source_type: string; source_id: string; feature_id: string };
  facts: Fact[];
  examples: Example[];
}

// Simple duplicate detection that uses same topic + very similar label (case-insensitive).
function isDuplicate(a: Fact, b: Fact): boolean {
  if (a.topic !== b.topic) {
    return false;
  }
  const la = a.label.toLowerCase().trim();
  const lb = b.label.toLowerCase().trim();
  // exact label match or one contains the other
  return la === lb || la.includes(lb) || lb.includes(la);
}

export async function mergeKnowledge(
  featureId: string
): Promise<{ kb: FeatureKnowledgeBase; summary: string }> {
  const processedDirectory = normalisedDir(featureId);
  const extractFiles = await listFiles(processedDirectory, ".extract.json");
  const allExtractedInformation: Fact[] = [];
  const allExamples: Example[] = [];
  for (const filePath of extractFiles) {
    const extraction = await readJson<ExtractedData>(filePath);
    allExtractedInformation.push(...extraction.facts);
    allExamples.push(...extraction.examples);
  }
  // Remove duplicates
  const uniqueInformation: Fact[] = [];
  for (const fact of allExtractedInformation) {
    const duplicateIndex = uniqueInformation.findIndex((f) =>
      isDuplicate(f, fact)
    );
    if (duplicateIndex === -1) {
      uniqueInformation.push(fact);
    } else {
      // Keep the higher-confidence version
      const existing = uniqueInformation[duplicateIndex] as Fact;
      const bestVersion =
        existing.confidence === "high" ||
        (existing.confidence === "medium" && fact.confidence === "low")
          ? existing
          : fact;
      uniqueInformation[duplicateIndex] = bestVersion;
    }
  }

  // Re-assign clean sequential IDs after merge
  const mergedFacts: Fact[] = uniqueInformation.map((f, i) => ({
    ...f,
    id: makeId("fact", i),
  }));

  const mergedExamples: Example[] = allExamples.map((e, i) => ({
    ...e,
    id: makeId("ex", i),
  }));

  const openQuestions = mergedFacts.filter((f) => f.topic === "open_question");
  const conflicts = mergedFacts.filter((f) => f.status === "conflicting");

  const knowledgeBase: FeatureKnowledgeBase = {
    featureId,
    generatedAt: new Date().toISOString(),
    facts: mergedFacts,
    examples: mergedExamples,
    openQuestions,
    conflicts,
  };

  await ensureDir(kbDir());
  await writeJson(kbFilePath(featureId), knowledgeBase);

  const summary = `Merged -> Facts: (${mergedFacts.length}) | Open: (${openQuestions.length}) | Conflicting: (${conflicts.length}) | Examples: (${mergedExamples.length})`;

  return { kb: knowledgeBase, summary };
}
