import { confluenceSourcesDir, excelSourcesDir } from "@/config/index";
import { copyFileTo } from "@/utils/files";
import type { PipelineSourcesInput } from "@/types/index";

export async function collectSources(
  featureId: string,
  sources: PipelineSourcesInput
): Promise<void> {
  const confDir = confluenceSourcesDir(featureId);
  const xlsxDir = excelSourcesDir(featureId);

  for (const filePath of sources.confluence) {
    await copyFileTo(filePath, confDir);
  }

  for (const filePath of sources.excel) {
    await copyFileTo(filePath, xlsxDir);
  }
}
