import { kbFilePath, reviewFilePath, reviewDir } from "@/config/index";
import { readJson, writeText, ensureDir } from "@/utils/files";
import type { Fact, FeatureKnowledgeBase, ReviewStats } from "@/types/index";

function formatFact(fact: Fact): string {
  const { provenance } = fact;
  return [
    `### ${fact.label}`,
    "",
    `- **ID:** \`${fact.id}\``,
    `- **Topic:** \`${fact.topic}\``,
    `- **Status:** \`${fact.status}\``,
    `- **Confidence:** \`${fact.confidence}\``,
    `- **Source type:** \`${provenance.source_type}\``,
    `- **Source:** \`${provenance.source_id}\``,
    provenance.file_path ? `- **File:** \`${provenance.file_path}\`` : "",
    provenance.section ? `- **Section:** \`${provenance.section}\`` : "",
    provenance.batch_id ? `- **Batch:** \`${provenance.batch_id}\`` : "",
    "",
    fact.content,
  ]
    .filter(Boolean)
    .join("\n");
}

function addFactSection(
  lines: string[],
  title: string,
  description: string,
  facts: Fact[]
): void {
  if (facts.length === 0) return;
  lines.push(`## ${title}`, "", `> ${description}`, "");
  for (const fact of facts) {
    lines.push(formatFact(fact), "", "---", "");
  }
}

export async function generateReview(
  featureId: string,
  onProgress?: (msg: string) => void
): Promise<ReviewStats> {
  onProgress?.(`Reading knowledge base for "${featureId}"...`);
  const kb = await readJson<FeatureKnowledgeBase>(kbFilePath(featureId));
  const lowConfidence = kb.facts.filter(
    (fact) => fact.confidence === "low" && fact.topic !== "open_question"
  );
  // Count facts by source in one pass.
  const sourceCounts = new Map<string, number>();
  for (const fact of kb.facts) {
    const source = `${fact.provenance.source_type}:${fact.provenance.source_id}`;
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }
  const lines: string[] = [
    `# Review Report — ${featureId}`,
    "",
    `> Generated on ${new Date().toLocaleString()}`,
    "",
    "## Summary",
    "",
    "| Category | Count |",
    "|---|---:|",
    `| Facts | ${kb.facts.length} |`,
    `| Examples | ${kb.examples.length} |`,
    `| Conflicts | ${kb.conflicts.length} |`,
    `| Open questions | ${kb.openQuestions.length} |`,
    `| Low-confidence facts | ${lowConfidence.length} |`,
    "",
  ];
  onProgress?.("Checking conflicts and uncertain facts...");
  addFactSection(
    lines,
    "Conflicts",
    "Resolve these before publishing documentation.",
    kb.conflicts
  );
  addFactSection(
    lines,
    "Open Questions",
    "Clarify these items before publishing.",
    kb.openQuestions
  );
  addFactSection(
    lines,
    "Low-Confidence Facts",
    "Verify these facts against the original source.",
    lowConfidence
  );
  lines.push("## Sources", "", "| Source | Facts |", "|---|---:|");
  for (const [source, count] of sourceCounts) {
    lines.push(`| \`${source}\` | ${count} |`);
  }
  const hasIssues =
    kb.conflicts.length > 0 ||
    kb.openQuestions.length > 0 ||
    lowConfidence.length > 0;
  if (!hasIssues) {
    lines.push(
      "",
      "## Review Complete",
      "",
      "No conflicts, open questions, or low-confidence facts found."
    );
  } else {
    lines.push(
      "",
      "## Review Required",
      "",
      "Resolve the issues above before publishing the generated documentation."
    );
  }
  onProgress?.("Writing review report...");
  await ensureDir(reviewDir());
  const reportPath = reviewFilePath(featureId);
  await writeText(reportPath, lines.join("\n"));
  return {
    totalFacts: kb.facts.length,
    examplesCount: kb.examples.length,
    conflictsCount: kb.conflicts.length,
    openQuestionsCount: kb.openQuestions.length,
    lowConfidenceCount: lowConfidence.length,
    reportPath,
  };
}
