import path from "path";
import { mdToPdf } from "md-to-pdf";
import chalk from "chalk";
import { zodResponseFormat } from "openai/helpers/zod";

import { openai } from "@/llm/client";
import { DocPageSchema } from "@/llm/schemas";
import { docPageMessages, type PageSectionInput } from "@/llm/prompts";
import {
  OPENAI_MODEL,
  kbFilePath,
  gitbookDocsDir,
  confluenceDocsDir,
  pdfDocsDir,
} from "@/config/index";
import { readJson, writeText, ensureDir } from "@/utils/files";
import type {
  FeatureKnowledgeBase,
  Fact,
  DocType,
  FactTopic,
  PageGroup,
  WrittenPage,
  GeneratedDoc,
} from "@/types/index";

// Returns only page groups that have relevant knowledge.
function getPageGroups(
  kb: FeatureKnowledgeBase,
  docType: DocType
): PageGroup[] {
  const topics = new Set(kb.facts.map((fact) => fact.topic));
  const hasContent = (...factTopics: FactTopic[]) =>
    factTopics.some((topic) => topics.has(topic));
  const groups: PageGroup[] =
    docType === "developer"
      ? [
          {
            title: "Overview",
            slug: "overview",
            subDir: "setup",
            sections: [
              {
                title: "Concepts",
                topics: ["concept", "terminology", "other"],
              },
              {
                title: "Logic",
                topics: [
                  "behavior",
                  "accounting",
                  "database",
                  "business_event",
                ],
              },
            ],
            includeExamples: false,
          },
          {
            title: "API Reference",
            slug: "api-reference",
            subDir: "reference",
            sections: [
              {
                title: "API Reference",
                topics: ["api", "integration", "configuration"],
              },
            ],
            includeExamples: false,
          },
          {
            title: "Troubleshooting",
            slug: "troubleshooting",
            subDir: "internals",
            sections: [
              {
                title: "Troubleshooting",
                topics: ["edge_case", "constraint"],
              },
            ],
            includeExamples: false,
          },
          {
            title: "Examples",
            slug: "examples",
            subDir: "examples",
            sections: [{ title: "Examples", topics: [] }],
            includeExamples: true,
          },
        ]
      : [
          {
            title: "Introduction",
            slug: "introduction",
            subDir: "guides",
            sections: [
              {
                title: "Introduction",
                topics: ["concept", "terminology", "other"],
              },
              { title: "Concepts", topics: ["terminology", "concept"] },
            ],
            includeExamples: false,
          },
          {
            title: "Getting Started",
            slug: "getting-started",
            subDir: "guides",
            sections: [
              {
                title: "Getting Started",
                topics: ["configuration", "behavior"],
              },
              {
                title: "Usage",
                topics: ["behavior", "api", "business_event"],
              },
            ],
            includeExamples: false,
          },
          {
            title: "Troubleshooting",
            slug: "troubleshooting",
            subDir: "guides",
            sections: [
              {
                title: "Troubleshooting",
                topics: ["edge_case", "constraint"],
              },
            ],
            includeExamples: false,
          },
          {
            title: "Examples",
            slug: "examples",
            subDir: "examples",
            sections: [{ title: "Examples", topics: [] }],
            includeExamples: true,
          },
        ];
  return groups.filter(
    (group) =>
      (group.includeExamples && kb.examples.length > 0) ||
      group.sections.some(
        (section) => section.topics.length > 0 && hasContent(...section.topics)
      )
  );
}

// Removes unreliable facts before documentation generation.
function filterFacts(kb: FeatureKnowledgeBase, topics: FactTopic[]): Fact[] {
  if (!topics.length) return [];
  return kb.facts.filter(
    (fact) =>
      topics.includes(fact.topic) &&
      fact.confidence !== "low" &&
      fact.status !== "conflicting" &&
      fact.topic !== "open_question"
  );
}

// Generates one documentation page using the LLM.
async function generatePage(
  group: PageGroup,
  kb: FeatureKnowledgeBase,
  docType: DocType,
  onProgress?: (msg: string) => void
): Promise<string> {
  const audience = docType === "developer" ? "Developer" : "User";
  onProgress?.(`Generating ${audience} Page "${group.title}"...`);
  const lastSection = group.sections.length - 1;
  const sectionsInput: PageSectionInput[] = group.sections.map(
    (section, index) => ({
      title: section.title,
      facts: filterFacts(kb, section.topics),
      examples:
        group.includeExamples && index === lastSection ? kb.examples : [],
    })
  );
  try {
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: docPageMessages(group.title, sectionsInput, docType),
      response_format: zodResponseFormat(DocPageSchema, "doc_page"),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed?.sections) {
      throw new Error(`No valid content generated for "${group.title}"`);
    }
    return group.sections
      .map((section) => {
        const generated = parsed.sections.find(
          (item) => item.title === section.title
        );
        return generated?.content
          ? `## ${section.title}\n\n${generated.content}`
          : `## ${section.title}\n\n_Section generation failed._`;
      })
      .join("\n\n---\n\n");
  } catch (error) {
    console.error(
      chalk.red(
        `[generate] Failed to generate "${group.title}": ${String(error)}`
      )
    );
    return group.sections
      .map(
        (section) =>
          `## ${section.title}\n\n_Page generation failed. Please review manually._`
      )
      .join("\n\n---\n\n");
  }
}

// Creates the GitBook page header.
function gitbookPreamble(title: string): string {
  return `# ${title}\n\n> Updated: ${new Date().toLocaleString()}\n\n---\n\n`;
}

// Creates the Confluence page header.
function confluencePreamble(title: string, labels: string[]): string {
  const labelLine = labels.length
    ? `<!-- Labels: ${labels.join(", ")} -->\n`
    : "";
  return `${labelLine}# ${title}\n\n> Updated: ${new Date().toLocaleString()}\n\n---\n\n`;
}

const SUB_DIR_LABELS: Record<string, string> = {
  setup: "Setup",
  internals: "Internals",
  reference: "Reference",
  guides: "Guides",
  examples: "Examples",
};

// Groups generated pages by output directory.
function groupPagesBySubDir(pages: WrittenPage[]): Map<string, WrittenPage[]> {
  const grouped = new Map<string, WrittenPage[]>();
  for (const page of pages) {
    const key = page.subDir || "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(page);
  }
  return grouped;
}

// Generates all pages for one documentation type.
async function generateDocContent(
  kb: FeatureKnowledgeBase,
  docType: DocType,
  onProgress?: (msg: string) => void
): Promise<GeneratedDoc> {
  const groups = getPageGroups(kb, docType);
  const overviewTitle = docType === "developer" ? "Overview" : "Introduction";
  onProgress?.(
    `Generating ${docType === "developer" ? "Developer" : "User"} overview...`
  );
  let overviewBody: string;
  try {
    const completion = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: docPageMessages(
        overviewTitle,
        [
          {
            title: overviewTitle,
            facts: filterFacts(kb, [
              "concept",
              "terminology",
              "behavior",
              "business_event",
            ]),
            examples: [],
          },
        ],
        docType
      ),
      response_format: zodResponseFormat(DocPageSchema, "doc_page"),
    });
    overviewBody =
      completion.choices[0]?.message.parsed?.sections?.[0]?.content ??
      "_Overview generation failed._";
  } catch (error) {
    console.error(chalk.red(`[generate] Overview failed: ${String(error)}`));
    overviewBody = "_Overview generation failed. Please review manually._";
  }
  const pages: GeneratedDoc["pages"] = [];
  for (const group of groups) {
    pages.push({
      group,
      body: await generatePage(group, kb, docType, onProgress),
    });
  }
  return { overviewBody, pages };
}

// Writes GitBook Markdown files and SUMMARY.md.
async function buildGitBookOutput(
  kb: FeatureKnowledgeBase,
  docType: DocType,
  generatedDoc: GeneratedDoc,
  outDir: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.(`Writing ${docType} GitBook files...`);
  await ensureDir(outDir);
  const written: WrittenPage[] = [];
  const title =
    docType === "developer"
      ? `${kb.featureId} — Developer Documentation`
      : `${kb.featureId} — User Guide`;
  await writeText(
    path.join(outDir, "README.md"),
    gitbookPreamble(title) + generatedDoc.overviewBody
  );
  for (const { group, body } of generatedDoc.pages) {
    const pageDir = path.join(outDir, group.subDir);
    await ensureDir(pageDir);
    await writeText(
      path.join(pageDir, `${group.slug}.md`),
      gitbookPreamble(group.title) + body
    );
    written.push({
      title: group.title,
      subDir: group.subDir,
      slug: group.slug,
    });
  }
  const summary = ["# Summary", "", "* [Overview](README.md)", ""];
  for (const [subDir, pages] of groupPagesBySubDir(written)) {
    summary.push(`## ${SUB_DIR_LABELS[subDir] ?? subDir}`, "");
    for (const page of pages) {
      summary.push(`* [${page.title}](${subDir}/${page.slug}.md)`);
    }
    summary.push("");
  }
  await writeText(path.join(outDir, "SUMMARY.md"), summary.join("\n"));
}

// Writes Confluence-compatible Markdown files.
async function buildConfluenceOutput(
  kb: FeatureKnowledgeBase,
  docType: DocType,
  generatedDoc: GeneratedDoc,
  outDir: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.(`Writing ${docType} Confluence files...`);
  await ensureDir(outDir);
  const written: WrittenPage[] = [];
  for (const { group, body } of generatedDoc.pages) {
    const pageDir = path.join(outDir, group.subDir);
    await ensureDir(pageDir);
    const labels = [
      docType,
      group.subDir,
      ...new Set(
        group.sections.flatMap((section) =>
          section.topics.map((topic) => topic.replace("_", "-"))
        )
      ),
    ];
    await writeText(
      path.join(pageDir, `${group.slug}.md`),
      confluencePreamble(group.title, labels) + body
    );
    written.push({
      title: group.title,
      subDir: group.subDir,
      slug: group.slug,
    });
  }
  const title =
    docType === "developer"
      ? `${kb.featureId} — Developer Documentation`
      : `${kb.featureId} — User Guide`;
  const tree = ["## Page Tree", ""];
  for (const [subDir, pages] of groupPagesBySubDir(written)) {
    tree.push(`### ${SUB_DIR_LABELS[subDir] ?? subDir}`, "");
    for (const page of pages) {
      tree.push(`- [${page.title}](${subDir}/${page.slug}.md)`);
    }
    tree.push("");
  }
  await writeText(
    path.join(outDir, "index.md"),
    confluencePreamble(title, [docType, "index"]) +
      generatedDoc.overviewBody +
      "\n\n---\n\n" +
      tree.join("\n")
  );
}

// Combines all pages and converts them to PDF.
async function buildPdfOutput(
  kb: FeatureKnowledgeBase,
  docType: DocType,
  generatedDoc: GeneratedDoc,
  outDir: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.(`Generating ${docType} PDF...`);
  await ensureDir(outDir);
  const title =
    docType === "developer"
      ? `${kb.featureId} — Developer Documentation`
      : `${kb.featureId} — User Guide`;
  const sections = generatedDoc.pages
    .map(({ group, body }) => `## ${group.title}\n\n${body}`)
    .join("\n\n---\n\n");
  const markdown = `# ${title}\n\n${generatedDoc.overviewBody}\n\n---\n\n${sections}`;
  const mdPath = path.join(outDir, `${docType}-combined.md`);
  await writeText(mdPath, markdown);
  try {
    await mdToPdf(
      { content: markdown },
      { dest: path.join(outDir, `${docType}-documentation.pdf`) }
    );
  } catch (error) {
    console.error(
      chalk.red(`[generate] PDF generation failed: ${String(error)}`)
    );
  }
}

// Generates Developer and User documentation in all output formats.
export async function generateDocs(
  featureId: string,
  onProgress?: (message: string) => void
): Promise<void> {
  const kb = await readJson<FeatureKnowledgeBase>(kbFilePath(featureId));
  for (const docType of ["developer", "user"] as DocType[]) {
    const generatedDoc = await generateDocContent(kb, docType, onProgress);
    await buildGitBookOutput(
      kb,
      docType,
      generatedDoc,
      gitbookDocsDir(featureId, docType),
      onProgress
    );
    await buildConfluenceOutput(
      kb,
      docType,
      generatedDoc,
      confluenceDocsDir(featureId, docType),
      onProgress
    );
    await buildPdfOutput(
      kb,
      docType,
      generatedDoc,
      pdfDocsDir(featureId, docType),
      onProgress
    );
  }
}
