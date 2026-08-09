/**
 * Usage: bun run index.ts <featureId> [options]
 *
 * Options:
 *   --sources-dir <dir>    Directory containing source files (defaults to ./docs)
 *   --confluence <file>    Specific Confluence .md files to include
 *   --excel <file>         Specific Excel .xlsx files to include
 *   --skip <stages>        Comma-separated stage numbers to skip
 *
 * Examples:
 *   bun run index.ts capitalised_income --sources-dir ./docs
 *   bun run index.ts capitalised_income --confluence ./docs/MyPage.md --excel ./docs/Data.xlsx
 *   bun run index.ts capitalised_income --sources-dir ./docs --skip 1,2
 */

import path from "path";
import fs from "fs/promises";
import chalk from "chalk";
import { runPipeline } from "@/pipeline";
import type { PipelineSourcesInput } from "@/types/index";

function printUsage() {
  console.log(`
  ${chalk.cyan.bold("Automated Documentation Pipeline")}
  ${chalk.dim("----------------------------------------")}
  ${chalk.bold("Usage:")}
    bun run index.ts <featureId> [options]
  ${chalk.bold("Options:")}
    --sources-dir <dir>    Auto-discover .md and .xlsx files from a directory
    --confluence <file>    Add a specific Confluence .md file
    --excel <file>         Add a specific Excel .xlsx file
    --skip <n,n,...>       Skip stage numbers (e.g. --skip 1,2)
  ${chalk.bold("Examples:")}
    bun run index.ts capitalised_income --sources-dir ./docs
    bun run index.ts documentation_pipeline --confluence ./pages/plan.md --excel ./data/QnA.xlsx
  `);
}

async function discoverSourcesFromDir(
  dir: string
): Promise<PipelineSourcesInput> {
  const absDir = path.resolve(dir);
  let entries: string[] = [];
  try {
    const raw = await fs.readdir(absDir);
    entries = raw.map((e) => path.join(absDir, e));
  } catch {
    console.error(chalk.red(`[cli] Cannot read sources directory: ${absDir}`));
    process.exit(1);
  }
  const confluence = entries.filter((e) => e.toLowerCase().endsWith(".md"));
  const excel = entries.filter((e) => e.toLowerCase().endsWith(".xlsx"));
  return { confluence, excel };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }
  const featureId = args[0];
  if (!featureId || featureId.startsWith("--")) {
    console.error(chalk.red("[cli] First argument must be the feature ID."));
    printUsage();
    process.exit(1);
  }
  // Parse flags
  const confluenceFiles: string[] = [];
  const excelFiles: string[] = [];
  let sourcesDir: string | null = null;
  const skipStages: number[] = [];
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === "--sources-dir" && nextArg) {
      sourcesDir = nextArg;
      i++;
    } else if (arg === "--confluence" && nextArg) {
      confluenceFiles.push(path.resolve(nextArg));
      i++;
    } else if (arg === "--excel" && nextArg) {
      excelFiles.push(path.resolve(nextArg));
      i++;
    } else if (arg === "--skip" && nextArg) {
      const stages = nextArg.split(",").map((s) => parseInt(s.trim(), 10));
      skipStages.push(...stages.filter((n) => !isNaN(n)));
      i++;
    }
  }
  // Build sources input
  let sources: PipelineSourcesInput = {
    confluence: confluenceFiles,
    excel: excelFiles,
  };
  if (sourcesDir) {
    const discovered = await discoverSourcesFromDir(sourcesDir);
    sources = {
      confluence: [...sources.confluence, ...discovered.confluence],
      excel: [...sources.excel, ...discovered.excel],
    };
  }
  if (sources.confluence.length === 0 && sources.excel.length === 0) {
    console.error(chalk.red("[cli] No source files found."));
    printUsage();
    process.exit(1);
  }
  await runPipeline({ featureId, sources, skipStages });
}

main().catch((err) => {
  console.error(chalk.red("\n[cli] Fatal error:"), err);
  process.exit(1);
});
