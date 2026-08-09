import path from "path";
import { confluenceSourcesDir, normalisedDir } from "@/config/index";
import { listFiles, writeText } from "@/utils/files";
import { normaliseConfluence } from "@/sources/confluence";
import type { NormalisedDoc } from "@/types/index";

export async function normaliseSources(
  featureId: string
): Promise<NormalisedDoc[]> {
  const outDir = normalisedDir(featureId);
  const results: NormalisedDoc[] = [];
  const confluenceFiles = await listFiles(
    confluenceSourcesDir(featureId),
    ".md"
  );
  for (const filePath of confluenceFiles) {
    try {
      const doc = await normaliseConfluence(filePath, featureId);
      const outName = `confluence__${path.basename(filePath, ".md")}.md`;
      const outPath = path.join(outDir, outName);
      await writeText(outPath, doc.content);
      doc.filePath = outPath;
      results.push(doc);
    } catch (err) {
      throw new Error(`Failed to normalise ${filePath}: ${err}`);
    }
  }
  return results;
}
