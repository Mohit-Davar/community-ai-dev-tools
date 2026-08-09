/**
 * Generate Documentation
 *
 * Reads the merged FeatureKnowledgeBase and generates two documentation files:
 *   - developer.md
 *   - user.md
 *
 * Generation is section-by-section. Each section query filters only the
 * relevant facts from the KB, keeping prompts focused and quality high.
 */

import path from "path";
import { zodResponseFormat } from "openai/helpers/zod";
import { openai } from "@/llm/client";
import { DocSectionSchema } from "@/llm/schemas";
import { docSectionMessages } from "@/llm/prompts";
import { OPENAI_MODEL } from "@/config/index";
import { kbFilePath, docsDir } from "@/config/index";
import { readJson, writeText, ensureDir } from "@/utils/files";
import type {
  FeatureKnowledgeBase,
  Fact,
  Example,
  DocType,
  FactTopic,
} from "@/types/index";
import pLimit from "p-limit";
import chalk from "chalk";

// Section Definitions
// Section Definitions
function getSections(
  kb: FeatureKnowledgeBase,
  docType: DocType
): Array<{ title: string; topics: FactTopic[] }> {
  const presentTopics = new Set(kb.facts.map((f) => f.topic));
  const sections: Array<{ title: string; topics: FactTopic[] }> = [];

  if (docType === "developer") {
    // System Overview & Architecture
    sections.push({
      title: "System Overview & Architecture",
      topics: ["concept", "terminology"],
    });
    // Getting Started & Setup
    sections.push({
      title: "Getting Started & Setup",
      topics: ["concept", "other"],
    });
    // Configuration Reference
    if (presentTopics.has("configuration")) {
      sections.push({
        title: "Configuration Reference",
        topics: ["configuration"],
      });
    }
    // Business Logic & Core Workflows
    if (presentTopics.has("behavior")) {
      sections.push({
        title: "Business Logic & Core Workflows",
        topics: ["behavior", "concept"],
      });
    }
    // Data Model & Database Schema
    if (presentTopics.has("database")) {
      sections.push({
        title: "Data Model & Database Schema",
        topics: ["database"],
      });
    }
    // API & Integration Reference
    if (
      presentTopics.has("api") ||
      presentTopics.has("integration") ||
      presentTopics.has("business_event")
    ) {
      sections.push({
        title: "API & Integration Reference",
        topics: ["api", "integration", "business_event"],
      });
    }
    // Accounting & General Ledger Entries
    if (presentTopics.has("accounting")) {
      sections.push({
        title: "Accounting & General Ledger Entries",
        topics: ["accounting"],
      });
    }
    // Edge Cases & Validation Constraints
    if (presentTopics.has("edge_case") || presentTopics.has("constraint")) {
      sections.push({
        title: "Edge Cases & Validation Constraints",
        topics: ["edge_case", "constraint"],
      });
    }
    // Known Limitations & Technical Debt
    if (presentTopics.has("open_question")) {
      sections.push({
        title: "Known Limitations & Technical Debt",
        topics: ["open_question", "constraint"],
      });
    }
    // Worked Scenarios
    if (kb.examples && kb.examples.length > 0) {
      sections.push({ title: "Worked Scenarios", topics: [] });
    }
  } else {
    // Welcome & Feature Introduction
    sections.push({
      title: "Welcome & Feature Introduction",
      topics: ["concept", "terminology"],
    });
    // Onboarding & Getting Started
    sections.push({
      title: "Onboarding & Getting Started",
      topics: ["concept", "configuration"],
    });
    // Dashboard & Service Overview
    sections.push({
      title: "Dashboard & Service Overview",
      topics: ["concept", "other"],
    });
    // Customer Guide
    if (presentTopics.has("behavior") || presentTopics.has("api")) {
      sections.push({
        title: "Customer Guide",
        topics: ["behavior", "api"],
      });
    }
    // Operator Guide
    if (presentTopics.has("behavior") || presentTopics.has("configuration")) {
      sections.push({
        title: "Operator Guide",
        topics: ["behavior", "configuration"],
      });
    }
    // Security & Fraud Prevention
    sections.push({
      title: "Security & Fraud Prevention",
      topics: ["constraint", "edge_case"],
    });
    // Troubleshooting & FAQs
    if (
      presentTopics.has("open_question") ||
      presentTopics.has("constraint") ||
      presentTopics.has("edge_case")
    ) {
      sections.push({
        title: "Troubleshooting & FAQs",
        topics: ["open_question", "constraint", "edge_case"],
      });
    }
    // Worked Scenarios
    if (kb.examples && kb.examples.length > 0) {
      sections.push({ title: "Worked Scenarios", topics: [] });
    }
  }
  return sections;
}

// Fact Filtering
function filterFacts(kb: FeatureKnowledgeBase, topics: FactTopic[]): Fact[] {
  if (topics.length === 0) return [];
  return kb.facts.filter((f) => topics.includes(f.topic));
}

// Section Generation
async function generateSection(
  title: string,
  facts: Fact[],
  examples: Example[],
  docType: DocType
): Promise<string> {
  const messages = docSectionMessages(title, docType, facts, examples);
  const completion = await openai.chat.completions.parse({
    model: OPENAI_MODEL,
    messages,
    response_format: zodResponseFormat(DocSectionSchema, "doc_section"),
  });
  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(`[generate] LLM returned null for section: ${title}`);
  }
  return `## ${title}\n\n${parsed.content}`;
}

// Document Assembly
async function generateDoc(
  kb: FeatureKnowledgeBase,
  docType: DocType,
  onProgress?: (msg: string) => void
): Promise<string> {
  const sections = getSections(kb, docType);

  const title =
    docType === "developer"
      ? `# ${kb.featureId} — Developer Documentation`
      : `# ${kb.featureId} — User Guide`;

  const preamble = [
    title,
    "",
    `> Generated by Pepper Soup on ${new Date().toLocaleString()}`,
    "",
    "---",
    "",
  ].join("\n");

  const limit = pLimit(3);
  const promises = sections.map((section) =>
    limit(async () => {
      if (onProgress) {
        onProgress(`Generating [${docType}] section: "${section.title}"...`);
      }
      const relevantFacts = filterFacts(kb, section.topics);
      const relevantExamples =
        section.title === "Worked Scenarios" ? kb.examples : [];
      try {
        return await generateSection(
          section.title,
          relevantFacts,
          relevantExamples,
          docType
        );
      } catch (err) {
        console.error(
          chalk.red.dim(
            `[generate] Failed to generate section "${section.title}": ${err}`
          )
        );
        return `## ${section.title}\n\n_Section generation failed. Please review manually._`;
      }
    })
  );

  const sectionContents = await Promise.all(promises);

  return preamble + sectionContents.join("\n\n---\n\n");
}

// Stage Entry Point
export async function generateDocs(
  featureId: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  const kbPath = kbFilePath(featureId);
  const kb = await readJson<FeatureKnowledgeBase>(kbPath);
  const outDir = docsDir(featureId);
  await ensureDir(outDir);

  // Developer docs
  const devDoc = await generateDoc(kb, "developer", onProgress);
  const devPath = path.join(outDir, "developer.md");
  await writeText(devPath, devDoc);

  // User docs
  const userDoc = await generateDoc(kb, "user", onProgress);
  const userPath = path.join(outDir, "user.md");
  await writeText(userPath, userDoc);
}
