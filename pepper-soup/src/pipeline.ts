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

  console.log(chalk.dim(`\n${"─".repeat(60)}`));
  console.log(chalk.cyan.bold(" Documentation Generation Pipeline"));
  console.log(` Feature  : ${chalk.bold(featureId)}`);
  if (skip.size > 0) {
    const skipped = [...skip]
      .sort((a, b) => a - b)
      .map((s) => `Stage ${s}`)
      .join(", ");
    console.log(` Skipping : ${chalk.yellow(skipped)}`);
  }
  console.log(chalk.dim(`${"─".repeat(60)}\n`));

  const spinner = ora();

  try {
    // Source Collection
    if (!skip.has(1)) {
      spinner.start("Stage 1/6: Collecting source files...");
      const counts = await collectSources(featureId, sources, (msg) => {
        spinner.text = `Stage 1/6: ${msg}`;
      });
      spinner.succeed(
        `Stage 1/6: Sources collected (${counts.confluenceCount} Confluence, ${counts.excelCount} Excel, ${counts.codeFilesCount} code files)`
      );
    } else {
      console.log(chalk.yellow("  - Stage 1/6: Source collection skipped"));
    }

    // Normalisation
    if (!skip.has(2)) {
      spinner.start("Stage 2/6: Normalising sources to Markdown...");
      const docs = await normaliseSources(featureId, (msg) => {
        spinner.text = `Stage 2/6: ${msg}`;
      });
      spinner.succeed(
        `Stage 2/6: Sources normalised (${docs.length} document${docs.length === 1 ? "" : "s"})`
      );
    } else {
      console.log(chalk.yellow("  - Stage 2/6: Source normalisation skipped"));
    }

    // Knowledge Extraction
    if (!skip.has(3)) {
      spinner.start("Stage 3/6: Extracting knowledge from sources...");
      const extracted = await extractKnowledge(featureId, (msg) => {
        spinner.text = `Stage 3/6: ${msg}`;
      });
      const factCount = extracted.reduce(
        (sum, item) => sum + item.facts.length,
        0
      );
      const exampleCount = extracted.reduce(
        (sum, item) => sum + item.examples.length,
        0
      );
      spinner.succeed(
        `Stage 3/6: Knowledge extracted (${factCount} facts, ${exampleCount} examples across ${extracted.length} batches)`
      );
    } else {
      console.log(chalk.yellow("  - Stage 3/6: Knowledge extraction skipped"));
    }

    // Knowledge Base Merge
    if (!skip.has(4)) {
      spinner.start("Stage 4/6: Merging and deduplicating knowledge base...");
      const { summary } = await mergeKnowledge(featureId, (msg) => {
        spinner.text = `Stage 4/6: ${msg}`;
      });
      spinner.succeed(`Stage 4/6: Knowledge base merged (${summary})`);
    } else {
      console.log(chalk.yellow("  - Stage 4/6: Knowledge base merge skipped"));
    }

    // Documentation Generation
    if (!skip.has(5)) {
      spinner.start("Stage 5/6: Generating documentation...");
      await generateDocs(featureId, (msg) => {
        spinner.text = `Stage 5/6: ${msg}`;
      });
      spinner.succeed(
        "Stage 5/6: Documentation generated (GitBook, Confluence, PDF for Developer & User)"
      );
    } else {
      console.log(
        chalk.yellow("  - Stage 5/6: Documentation generation skipped")
      );
    }

    // Review Report
    if (!skip.has(6)) {
      spinner.start("Stage 6/6: Generating review report...");
      const stats = await generateReview(featureId, (msg) => {
        spinner.text = `Stage 6/6: ${msg}`;
      });
      spinner.succeed(
        `Stage 6/6: Review report generated (${stats.conflictsCount} conflicts, ${stats.openQuestionsCount} open questions, ${stats.lowConfidenceCount} low confidence)`
      );
    } else {
      console.log(chalk.yellow("  - Stage 6/6: Review report skipped"));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(chalk.dim(`\n${"─".repeat(60)}`));
    console.log(
      chalk.green(
        ` ✔ Pipeline completed successfully in ${chalk.bold(`${elapsed}s`)}`
      )
    );
    console.log(chalk.dim(`${"─".repeat(60)}\n`));
  } catch (err) {
    if (spinner.isSpinning) {
      spinner.fail("Pipeline execution failed");
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(chalk.dim(`\n${"─".repeat(60)}`));
    console.error(chalk.red(` ✖ Pipeline failed after ${elapsed}s`));
    console.error(chalk.dim(`${"─".repeat(60)}\n`));
    throw err;
  }
}
