import type { DocType, Fact, Example } from "@/types/index";

// Knowledge Extraction
export function markdownBatchExtractionMessages(
  files: { sourceId: string; content: string }[]
) {
  const combined = files
    .map((f) => `===== DOCUMENT: ${f.sourceId} =====\n${f.content}`)
    .join("\n\n");
  return [
    {
      role: "system" as const,
      content:
        `Extract structured knowledge from the provided Markdown documents as a flat list of facts/examples. ` +
        `Do not invent or assume information. Include concepts, behavior, configuration, terminology, constraints, edge cases, integrations, APIs, accounting, database schema, business events, and open questions. ` +
        `For each fact provide: short label, complete content, confidence (high/medium/low), and status (confirmed/inferred/conflicting/open). ` +
        `Use 'conflicting' for contradictions and 'open' for mentioned but unexplained topics. ` +
        `Use 'inferred' only when reasonably derivable. Preserve contradictions; do not resolve them. ` +
        `Process every document.`,
    },
    {
      role: "user" as const,
      content: combined,
    },
  ];
}

// Knowledge Extraction code files
export function codeBatchExtractionMessages(
  featureId: string,
  files: { sourceId: string; content: string }[]
) {
  const combined = files
    .map((f) => `===== FILE: ${f.sourceId} =====\n${f.content}`)
    .join("\n\n");
  return [
    {
      role: "system" as const,
      content:
        `Extract structured knowledge ONLY related to feature '${featureId}' from the provided source code. ` +
        `Treat implementation as the source of truth. Ignore unrelated code and do not infer intended behavior. ` +
        `Include behavior, configuration, constraints, edge cases, APIs, database schema, business events, accounting, dependencies, and integrations. ` +
        `Focus on actual validation, conditions, defaults, state changes, calculations, database operations, and errors. ` +
        `For each fact provide: short label, complete content, confidence (high/medium/low), and status (confirmed/inferred/conflicting/open). ` +
        `Use 'conflicting' for contradictory implementations and 'open' for unclear or incomplete behavior. ` +
        `Do not treat comments or names as authoritative when implementation differs. ` +
        `These facts will be used to correct outdated or conflicting business documentation.`,
    },
    {
      role: "user" as const,
      content: combined,
    },
  ];
}

const SECTION_GUIDANCE: Record<string, Record<string, string>> = {
  developer: {
    Overview:
      "Explain why the feature exists, what it does, its main components, data flow, and integrations. Keep high-level; omit API details and formulas.",
    Concepts:
      "Define all domain terms developers need. Give a plain definition and important technical distinction. Keep terminology consistent with the API and UI.",
    Logic:
      "Explain rules, formulas, state changes, workflow steps, and GL entries. Answer exactly what happens internally when each action is triggered.",
    "API Reference":
      "Document each endpoint with method, path, purpose, parameters, response fields, and a realistic request/response example. Explain how to trigger the business logic.",
    Troubleshooting:
      "Cover each known edge case separately, including scenario, system response, and special handling. Include common errors, causes, and fixes.",
    Examples:
      "Provide 2–4 realistic, complete, executable code examples showing implementation, integration, or extension. Use plausible data.",
  },
  user: {
    Introduction:
      "Explain what the feature is, why users need it, its business value, and the problem it solves. Use only user-visible concepts; never mention code or internals.",
    Concepts:
      "Define every UI term in plain language. Use a glossary or definition list and match UI terminology exactly.",
    "Getting Started":
      "Give numbered first-time setup steps using exact screen names, buttons, menus, and fields. One action per step. End with the expected result.",
    Usage:
      "Give task-based instructions for common workflows. Group by task, use numbered steps, describe visible UI actions, and answer likely follow-up questions.",
    Troubleshooting:
      "Use Q&A format for common user errors and questions. Explain what users see, why it happens, and how to fix it.",
    Examples:
      "Provide 2–3 realistic walkthroughs. Describe the business situation, UI actions, result, and why the outcome matters.",
  },
};

export interface PageSectionInput {
  title: string;
  facts: Fact[];
  examples: Example[];
}

export function docPageMessages(
  pageTitle: string,
  sections: PageSectionInput[],
  docType: DocType
) {
  const isUser = docType === "user";
  const audience = isUser
    ? "Non-technical users and bank staff"
    : "Developers and engineers";

  const audienceRules = isUser
    ? `- No code, files, class names, variables, or internals.
- Describe only what users see, click, and experience.
- Use exact UI labels.`
    : `- Explain business logic, accounting, formulas, and edge cases.
- Do not list file names unless needed for integration.`;

  const sectionsText = sections
    .map((section) => {
      const guidance =
        SECTION_GUIDANCE[docType]?.[section.title] ??
        "Write a focused section with one clear purpose.";

      const businessFacts = section.facts.filter(
        (f) => f.provenance.source_type !== "code"
      );
      const codeFacts = section.facts.filter(
        (f) => f.provenance.source_type === "code"
      );

      const factsText =
        [
          businessFacts.length
            ? `BUSINESS FACTS:\n${businessFacts.map((f) => `- ${f.label}: ${f.content}`).join("\n")}`
            : "",
          codeFacts.length
            ? `IMPLEMENTATION FACTS:\n${codeFacts.map((f) => `- ${f.label}: ${f.content}`).join("\n")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n") || "No facts provided.";

      const examplesText = section.examples.length
        ? `EXAMPLES:\n${section.examples
            .map(
              (e) =>
                `${e.title}\nScenario: ${e.scenario}\n${e.steps
                  .map((s) => `${s.step}. ${s.description}`)
                  .join("\n")}\nResult: ${e.result}`
            )
            .join("\n\n")}`
        : "";

      return `--- SECTION: ${section.title} ---
PURPOSE: ${guidance}
${factsText}
${examplesText}`;
    })
    .join("\n\n");

  return [
    {
      role: "system" as const,
      content: `Write one ${isUser ? "user-facing" : "technical"} banking documentation page containing multiple sections.
Audience: ${audience}
Output: A JSON object with a 'sections' array. Each section must have its exact requested 'title', and its 'content' in Markdown.
FACT PRIORITY:
- Business facts define the narrative, wording, and tone.
- Implementation facts are the technical source of truth.
- If they conflict, follow implementation facts.
- Do not let implementation details dominate user-facing or narrative content.
RULES:
- Why before how.
- Answer likely reader questions proactively.
- Use short paragraphs, descriptive headings, lists, numbered steps, and tables where useful.
- Keep terminology consistent.
${audienceRules}
NEVER:
- Invent facts or cite anything outside the provided material.
- Add citations, reference numbers, or [1]-style markers.
- Use vague terms such as "pending", "awaiting clarification", or "not yet determined".
- Hedge with "may", "might", "could", or "possibly".
- Mention client-specific or internal team names.
- Use em dashes.`,
    },
    {
      role: "user" as const,
      content: `PAGE TITLE: ${pageTitle}\n\nPlease generate the following sections based on these requirements and facts:\n\n${sectionsText}`,
    },
  ];
}
