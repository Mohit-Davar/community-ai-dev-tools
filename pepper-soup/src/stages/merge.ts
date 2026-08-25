import { normalisedDir, kbFilePath, kbDir } from "@/config/index";
import { listFiles, readJson, writeJson, ensureDir } from "@/utils/files";
import type {
  Fact,
  Example,
  FeatureKnowledgeBase,
  Provenance,
  ExtractedData,
} from "@/types/index";

function isSimilar(textA: string, textB: string): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ");
  const normA = normalize(textA);
  const normB = normalize(textB);
  if (!normA || !normB) {
    return false;
  }
  if (normA === normB) {
    return true;
  }
  const tokensA = new Set(normA.split(" "));
  const tokensB = new Set(normB.split(" "));
  const common = [...tokensA].filter((token) => tokensB.has(token)).length;
  const similarity = common / Math.max(tokensA.size, tokensB.size);
  const lengthRatio =
    Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
  return similarity >= 0.75 && lengthRatio >= 0.5;
}

function isDuplicateFact(a: Fact, b: Fact): boolean {
  if (a.topic !== b.topic) {
    return false;
  }
  return isSimilar(a.label, b.label);
}

function isDuplicateExample(a: Example, b: Example): boolean {
  return isSimilar(a.title, b.title);
}

function mergeProvenances(
  a: Provenance[],
  b: Provenance | Provenance[]
): Provenance[] {
  const all = [...a, ...(Array.isArray(b) ? b : [b])];
  const unique = new Map<string, Provenance>();
  for (const p of all) {
    const key = `${p.source_type}:${p.source_id}:${p.file_path || ""}:${p.section || ""}`;
    if (!unique.has(key)) {
      unique.set(key, p);
    }
  }
  return Array.from(unique.values());
}

export async function mergeKnowledge(
  featureId: string,
  onProgress?: (msg: string) => void
): Promise<{ kb: FeatureKnowledgeBase; summary: string }> {
  onProgress?.("Discovering extracted knowledge files...");
  const files = await listFiles(normalisedDir(featureId), ".extract.json");

  const facts: Fact[] = [];
  const examples: Example[] = [];
  // Load all extracted facts and examples.
  onProgress?.(`Loading ${files.length} extraction files...`);
  for (const file of files) {
    const data = await readJson<ExtractedData>(file);
    facts.push(...data.facts);
    examples.push(...data.examples);
  }
  // Merge duplicate facts.
  onProgress?.(
    `Deduplicating ${facts.length} facts and resolving conflicts...`
  );
  // Topic-bucketed lookup
  const buckets = new Map<string, Fact[]>();
  for (const fact of facts) {
    if (!buckets.has(fact.topic)) {
      buckets.set(fact.topic, []);
    }
    const bucket = buckets.get(fact.topic)!;
    const index = bucket.findIndex((existing) =>
      isDuplicateFact(existing, fact)
    );
    if (index === -1) {
      // First time seeing this fact
      fact.all_provenances = mergeProvenances(
        fact.all_provenances || [fact.provenance],
        []
      );
      bucket.push(fact);
      continue;
    }
    const existing = bucket[index]!;
    const combinedProvenances = mergeProvenances(
      existing.all_provenances || [existing.provenance],
      fact.all_provenances || [fact.provenance]
    );
    // Code vs Non-code
    if (
      fact.provenance.source_type === "code" &&
      existing.provenance.source_type !== "code"
    ) {
      bucket[index] = {
        ...fact,
        status: "confirmed",
        all_provenances: combinedProvenances,
      };
      continue;
    }
    if (
      existing.provenance.source_type === "code" &&
      fact.provenance.source_type !== "code"
    ) {
      bucket[index] = {
        ...existing,
        status: "confirmed",
        all_provenances: combinedProvenances,
      };
      continue;
    }
    // Check if they disagree on content
    const sameContent = isSimilar(existing.content, fact.content);
    if (!sameContent) {
      // They disagree! Flag as conflict regardless of who wins primary.
      if (
        fact.confidence === "high" ||
        (fact.confidence === "medium" && existing.confidence === "low")
      ) {
        bucket[index] = {
          ...fact,
          status: "conflicting",
          all_provenances: combinedProvenances,
        };
      } else {
        bucket[index] = {
          ...existing,
          status: "conflicting",
          all_provenances: combinedProvenances,
        };
      }
    } else {
      // They agree on content.
      if (
        fact.confidence === "high" ||
        (fact.confidence === "medium" && existing.confidence === "low")
      ) {
        bucket[index] = {
          ...fact,
          status: existing.status === "confirmed" ? "confirmed" : fact.status,
          all_provenances: combinedProvenances,
        };
      } else {
        bucket[index] = {
          ...existing,
          status: fact.status === "confirmed" ? "confirmed" : existing.status,
          all_provenances: combinedProvenances,
        };
      }
    }
  }

  const mergedFacts = Array.from(buckets.values()).flat();
  // Merge duplicate examples, preferring code sources.
  onProgress?.(`Deduplicating ${examples.length} examples...`);
  const uniqueExamples: Example[] = [];
  for (const example of examples) {
    const index = uniqueExamples.findIndex((existing) =>
      isDuplicateExample(existing, example)
    );
    if (index === -1) {
      example.all_provenances = mergeProvenances(
        example.all_provenances || [example.provenance],
        []
      );
      uniqueExamples.push(example);
      continue;
    }
    const existing = uniqueExamples[index]!;
    const combinedProvenances = mergeProvenances(
      existing.all_provenances || [existing.provenance],
      example.all_provenances || [example.provenance]
    );
    if (
      example.provenance.source_type === "code" &&
      existing.provenance.source_type !== "code"
    ) {
      uniqueExamples[index] = {
        ...example,
        all_provenances: combinedProvenances,
      };
    } else {
      uniqueExamples[index] = {
        ...existing,
        all_provenances: combinedProvenances,
      };
    }
  }
  const mergedExamples = uniqueExamples;
  const openQuestions = mergedFacts.filter(
    (fact) => fact.topic === "open_question"
  );
  const conflicts = mergedFacts.filter((fact) => fact.status === "conflicting");
  const knowledgeBase: FeatureKnowledgeBase = {
    featureId,
    generatedAt: new Date().toISOString(),
    facts: mergedFacts,
    examples: mergedExamples,
    openQuestions,
    conflicts,
  };
  onProgress?.("Writing unified feature knowledge base to disk...");
  await ensureDir(kbDir());
  await writeJson(kbFilePath(featureId), knowledgeBase);
  const summary =
    `Facts: ${mergedFacts.length}, ` +
    `Examples: ${mergedExamples.length}, ` +
    `Conflicts: ${conflicts.length}, ` +
    `Open Questions: ${openQuestions.length}`;
  return { kb: knowledgeBase, summary };
}
