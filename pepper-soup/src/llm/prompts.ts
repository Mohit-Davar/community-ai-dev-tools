import type { DocType, Fact, Example } from "@/types/index";

// Confluence Normalisation
export function confluenceNormalisationMessages(rawContent: string) {
  return [
    {
      role: "system" as const,
      content: `You are a technical documentation cleaner.
Your task is to convert a raw Confluence page export into clean, well-structured Markdown.

Rules (follow strictly):
- Preserve ALL information — do not omit or summarize anything
- Preserve all tables exactly as-is (convert to Markdown table format)
- Preserve all headings and hierarchy
- Preserve all numbers and values exactly — never round, never approximate
- Preserve all code blocks and API examples
- Remove Confluence-specific markup artifacts (e.g. escaped characters like "\\-")
- Fix any formatting issues but do not change meaning
- Never invent or add information not present in the original`,
    },
    {
      role: "user" as const,
      content: `Clean and normalise this Confluence page export into structured Markdown:\n\n${rawContent}`,
    },
  ];
}

// Knowledge Extraction
export function knowledgeExtractionMessages(
  normalisedContent: string,
  sourceId: string
) {
  return [
    {
      role: "system" as const,
      content: `You are a knowledge extraction engine for financial software documentation.
Your task is to extract every piece of structured knowledge from the given document.

Extract ALL of the following if present:
- Concepts (what a thing is)
- Behaviors (what the system does, when, and why)
- Configuration options (fields, values, defaults, constraints)
- Terminology (definitions of terms)
- Constraints (validation rules, limits, conditions)
- Edge cases (special handling, preclosure, charge-off, backdating, etc.)
- Integrations (external systems, events, triggers)
- APIs (endpoints, methods, request/response fields)
- Accounting entries (GL accounts, debits/credits per transaction type)
- Database fields (tables, columns, their purpose)
- Business events (event names, when triggered)
- Open questions (anything explicitly marked NOT YET IMPLEMENTED or unclear)

For each fact:
- label: a short, specific identifier (e.g. "API: Add Capitalized Income endpoint")
- content: complete, unambiguous description with all details preserved
- confidence: high if explicitly stated, medium if implied, low if ambiguous
- status: confirmed / inferred / conflicting / open

Be thorough. It is better to extract too many facts than too few.
Source document: "${sourceId}"`,
    },
    {
      role: "user" as const,
      content: normalisedContent,
    },
  ];
}

// Doc Section Generation
const DEVELOPER_SECTION_GUIDANCE: Record<string, string> = {
  "System Overview & Architecture":
    "High-level overview of the feature, its architecture, role in the banking system, and how it interacts with other modules. Explain the core concepts.",
  "Getting Started & Setup":
    "Technical setup guidelines for developers looking to run, test, or contribute to this feature. Describe configuration files, environmental variables, or setup tasks.",
  "Configuration Reference":
    "Comprehensive reference of all configurations at the product and system levels. Include exact field names, types, constraints, default values, and General Ledger (GL) accounts.",
  "Business Logic & Core Workflows":
    "Deep dive into calculations, amortization methods, interest processing, and background business logic rules.",
  "Data Model & Database Schema":
    "Detailed database schema details, tables, columns, relations, balance types, audit fields, and data storage logic.",
  "API & Integration Reference":
    "Programmatic API endpoints, HTTP methods, path parameters, headers, JSON schemas, business events triggered, webhooks, and Close of Business (COB) execution patterns.",
  "Accounting & General Ledger Entries":
    "How transaction types map to debits and credits on GL accounts. Detail the transaction flows.",
  "Edge Cases & Validation Constraints":
    "Analysis of complex edge cases (e.g. preclosures, backdating, reversals, charge-offs) and validation/limit constraints.",
  "Known Limitations & Technical Debt":
    "Open questions, features not yet implemented, current restrictions, or future technical improvements.",
  "Worked Scenarios (Technical)":
    "Technical walkthrough of worked examples with exact data states, transaction footprints, and step-by-step program execution results.",
};

const USER_SECTION_GUIDANCE: Record<string, string> = {
  "Welcome & Feature Introduction":
    "A friendly, jargon-free introduction to what this banking service/feature is, who uses it, and how it helps customers and bank staff.",
  "Onboarding & Getting Started":
    "Step-by-step instructions for non-technical users on accessing this service, initial dashboard setup, and basic security prerequisites.",
  "Dashboard & Service Overview":
    "Overview of the visual interface. Explain key views, widgets, navigation menus, and what information is presented where.",
  "Consuming Services (Customer Guide)":
    "Detailed guide for customers/end-users on how to request, apply for, or use this banking service (e.g., initiating transfers, viewing loan schedules, making payments).",
  "Providing Services (Operator Guide)":
    "Detailed guide for banking staff, operators, or service providers on managing the lifecycle of the service (e.g., approving requests, setting interest limits, loan servicing).",
  "Security & Fraud Prevention":
    "Best practices for keeping accounts safe, understanding verification steps, timeout rules, and identifying potential fraud risks.",
  "Troubleshooting & FAQs":
    "Helpful solutions to common errors, application pending statuses, or verification issues. Keep it practical and easy to follow.",
  "Worked Scenarios (Practical)":
    "Real-world business scenarios showing concrete figures and the user journey from start to finish.",
};

export function docSectionMessages(
  section: string,
  docType: DocType,
  relevantFacts: Fact[],
  relevantExamples: Example[]
) {
  const guidance =
    docType === "developer"
      ? (DEVELOPER_SECTION_GUIDANCE[section] ??
        "Write a comprehensive section on this topic.")
      : (USER_SECTION_GUIDANCE[section] ??
        "Write a user-friendly section on this topic.");

  const audience =
    docType === "developer"
      ? "technical contributors looking to modify the codebase or software engineers accessing the application programmatically (integrating with APIs or events)"
      : "non-technical users using our application to consume banking services (customers) or provide/manage banking services (bank staff, operators, and administrators)";

  const factsText =
    relevantFacts.length > 0
      ? relevantFacts
          .map((f) => `[${f.topic.toUpperCase()}] ${f.label}:\n${f.content}`)
          .join("\n\n")
      : "No specific facts provided — use general knowledge about the section topic.";

  const examplesText =
    relevantExamples.length > 0
      ? relevantExamples
          .map(
            (e) =>
              `Example: ${e.title}\nScenario: ${e.scenario}\n${e.steps
                .map((s) => `${s.step}. ${s.description}`)
                .join("\n")}\nResult: ${e.result}`
          )
          .join("\n\n")
      : "";

  return [
    {
      role: "system" as const,
      content: `You are writing ${docType} documentation for a financial and banking software platform.
Your audience is: ${audience}.
Write clear, accurate, professional, and well-structured documentation.
Use Markdown formatting: headings (###/####), bullet lists, numbered lists, tables, and code blocks where appropriate.

Rules:
- Only use information from the provided facts. Do not invent details not present in the facts.
${
  docType === "developer"
    ? "- Provide technical, precise details, code schemas, field names, and mathematical calculations. Avoid hand-wavy descriptions."
    : "- Write in plain, user-friendly language. Avoid all software engineering jargon (like 'database schemas', 'HTTP methods', 'API parameters', 'JSON'). Focus on the actions the customer or banker needs to take in the app."
}`,
    },
    {
      role: "user" as const,
      content: `Write the "${section}" section of the ${docType} documentation.

Section guidance: ${guidance}

--- RELEVANT FACTS ---
${factsText}

${examplesText ? `--- RELEVANT EXAMPLES ---\n${examplesText}` : ""}

Write only the content for this section. Start directly with the section content (do not repeat the section title as a top-level heading — it will be added externally).`,
    },
  ];
}
