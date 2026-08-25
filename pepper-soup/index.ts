import path from "path";
import fs from "fs/promises";
import chalk from "chalk";

import { runPipeline } from "@/pipeline";
import type { PipelineSourcesInput } from "@/types/index";

function printUsage() {
  console.log(`
  ${chalk.cyan.bold("Documentation Generation Pipeline")}
  ${chalk.dim("─".repeat(45))}

  ${chalk.bold("Usage:")}
    bun run index.ts <featureId> --sources <file> [options]

  ${chalk.bold("Required:")}
    ${chalk.cyan("--sources <file>")}   Path to sources JSON configuration file

  ${chalk.bold("Options:")}
    ${chalk.cyan("--skip <stages>")}    Comma-separated list of stages to skip (e.g. 1,2)
    ${chalk.cyan("--help, -h")}         Display this help message

  ${chalk.bold("Examples:")}
    bun run index.ts capitalised_income --sources ./sources.json
    bun run index.ts capitalised_income --sources ./sources.json --skip 1,2
  `);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    return;
  }

  const featureId = args[0];
  if (!featureId || featureId.startsWith("--")) {
    console.error(chalk.red("[cli] Feature ID is required."));
    printUsage();
    process.exit(1);
  }

  let sourcesFile: string | undefined;
  const skipStages: number[] = [];
  // Parse command-line options.
  for (let i = 1; i < args.length; i++) {
    const option = args[i];
    if (!option) {
      console.error(chalk.red("[cli] Invalid empty argument."));
      process.exit(1);
    }
    if (!option.startsWith("--")) {
      console.error(chalk.red(`[cli] Unknown argument: ${option}`));
      printUsage();
      process.exit(1);
    }
    if (option === "--help") {
      printUsage();
      return;
    }
    const value = args[i + 1];
    switch (option) {
      case "--sources":
        if (!value || value.startsWith("--")) {
          console.error(chalk.red(`[cli] Missing value for ${option}.`));
          process.exit(1);
        }
        sourcesFile = path.resolve(value);
        i++;
        break;
      case "--skip": {
        if (!value || value.startsWith("--")) {
          console.error(chalk.red(`[cli] Missing value for ${option}.`));
          process.exit(1);
        }
        const stages = value
          .split(",")
          .map((stage) => stage.trim())
          .filter((stage) => stage.length > 0)
          .map(Number);
        if (stages.some((stage) => !Number.isInteger(stage) || stage < 0)) {
          console.error(chalk.red(`[cli] Invalid value for --skip: ${value}`));
          process.exit(1);
        }
        skipStages.push(...stages);
        i++;
        break;
      }
      default:
        console.error(chalk.red(`[cli] Unknown option: ${option}`));
        printUsage();
        process.exit(1);
    }
  }

  if (!sourcesFile) {
    console.error(chalk.red("[cli] --sources <file> is required."));
    printUsage();
    process.exit(1);
  }

  let sources: PipelineSourcesInput;
  try {
    const content = await fs.readFile(sourcesFile, "utf-8");
    const loaded = JSON.parse(content) as Partial<PipelineSourcesInput>;
    const baseDir = path.dirname(sourcesFile);
    sources = {
      confluence: (loaded.confluence ?? []).map((file) =>
        path.resolve(baseDir, file)
      ),
      excel: (loaded.excel ?? []).map((file) => path.resolve(baseDir, file)),
      code: (loaded.code ?? []).map((source) => ({
        ...source,
        dir: path.resolve(baseDir, source.dir),
      })),
    };
  } catch (error) {
    console.error(
      chalk.red(`[cli] Failed to load sources file: ${sourcesFile}`),
      error
    );
    process.exit(1);
  }

  if (
    !sources.confluence.length &&
    !sources.excel.length &&
    !sources.code.length
  ) {
    console.error(chalk.red("[cli] No source files found in sources.json."));
    process.exit(1);
  }

  await runPipeline({
    featureId,
    sources,
    skipStages,
  });
}

main().catch((error) => {
  console.error(chalk.red("\n[cli] Fatal error:"), error);
  process.exit(1);
});
