import chalk from "chalk";
import ora from "ora";
import { collectSources } from "@/stages/collect";
import { normaliseSources } from "@/stages/normalise";
import { extractKnowledge } from "@/stages/extract";
import { mergeKnowledge } from "@/stages/merge";
import { generateDocs } from "@/stages/generate";
import { generateReview } from "@/stages/review";
import type { PipelineRunOptions } from "@/types/index";

export async function runPipeline(options: PipelineRunOptions): Promise<void> {
  const { featureId, sources, skipStages } = options;
  const skip = new Set(skipStages);

  const startTime = Date.now();
  console.log(chalk.dim(`\n${"═".repeat(60)}`));
  console.log(`${chalk.cyan.bold("Automated Documentation Pipeline")}`);
  console.log(`Feature: ${chalk.bold(featureId)}`);
  if (skip.size > 0) {
    console.log(`Skipping stages: ${chalk.yellow([...skip].join(", "))}`);
  }
  console.log(chalk.dim(`${"═".repeat(60)}\n`));

  try {
    const spinner = ora();
    if (!skip.has(1)) {
      spinner.start("Collecting Sources");
      await collectSources(featureId, sources);
      spinner.succeed("Sources Collected");
    } else {
      console.log(chalk.yellow("Collecting Sources Skipped."));
    }
    if (!skip.has(2)) {
      spinner.start("Normalising Sources");
      await normaliseSources(featureId);
      spinner.succeed("Sources Normalised");
    } else {
      console.log(chalk.yellow("Normalising Sources Skipped."));
    }

    if (!skip.has(3)) {
      spinner.start("Extracting Knowledge");
      await extractKnowledge(featureId);
      spinner.succeed("Knowledge Extracted");
    } else {
      console.log(chalk.yellow("Extracting Knowledge Skipped."));
    }

    if (!skip.has(4)) {
      spinner.start("Merging Knowledge Base");
      const { summary } = await mergeKnowledge(featureId);
      spinner.succeed(summary);
    } else {
      console.log(chalk.yellow("Merging Knowledge Base Skipped."));
    }

    if (!skip.has(5)) {
      spinner.start("Generating Documentation");
      await generateDocs(featureId, (msg) => {
        spinner.text = msg;
      });
      spinner.succeed("Documentation Generated");
    } else {
      console.log(chalk.yellow("Generating Documentation Skipped."));
    }

    if (!skip.has(6)) {
      spinner.start("Generating Review Report");
      await generateReview(featureId);
      spinner.succeed("Review Report Generated");
    } else {
      console.log(chalk.yellow("[Stage 6] Skipped."));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(chalk.dim(`\n${"═".repeat(60)}`));
    console.log(`  Pipeline complete in ${chalk.bold(elapsed + "s")}`);
    console.log(chalk.dim(`${"═".repeat(60)}\n`));
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(chalk.red(`\n${"═".repeat(60)}`));
    console.error(chalk.red(`  Pipeline failed after ${elapsed}s`));
    console.error(chalk.red(`${"═".repeat(60)}\n`));
    throw err;
  }
}
