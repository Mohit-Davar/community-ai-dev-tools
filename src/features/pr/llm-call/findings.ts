import type { Findings } from "@src/features/pr/security-engine";
import type { DiffChunk } from "@src/shared";

// Group findings by file so they can be retrieved in O(1) when processing a diff chunk.
export function createFindingsTable(
  findings: Findings[]
): Map<string, Findings[]> {
  const findingsByFile = new Map<string, Findings[]>();

  for (const finding of findings) {
    const existingFindings = findingsByFile.get(finding.file) ?? [];
    existingFindings.push(finding);
    findingsByFile.set(finding.file, existingFindings);
  }

  return findingsByFile;
}

// Return only the findings that belong to files present in the current diff chunk.
export function getRelevantChunkFindings(
  chunk: DiffChunk,
  findingsByFile: Map<string, Findings[]>
): Findings[] {
  const relevantFindings: Findings[] = [];
  for (const diff of chunk.diffs) {
    const fileFindings = findingsByFile.get(diff.file);
    if (!fileFindings) {
      continue;
    }
    relevantFindings.push(...fileFindings);
  }

  return relevantFindings;
}
