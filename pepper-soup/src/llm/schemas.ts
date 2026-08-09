import { z } from "zod";

// ─── Confluence Normalisation ───────────────────────────────────────────────
// Used in Stage 2 to get clean Markdown from raw Confluence page export

export const NormalisedConfluenceSchema = z.object({
  clean_markdown: z
    .string()
    .describe(
      "The full cleaned Markdown content of the Confluence page. Must preserve all information, tables, headings, and exact numeric values. Never summarize or omit."
    ),
  suggested_title: z
    .string()
    .describe(
      "A short descriptive title for this document, derived from the content."
    ),
  content_type: z
    .enum(["page"])
    .describe("Always 'page' for Confluence documents."),
});

export type NormalisedConfluenceOutput = z.infer<
  typeof NormalisedConfluenceSchema
>;

// ─── Knowledge Extraction ──────────────────────────────────────────────────
// Used in Stage 3 to extract structured facts from a normalised Confluence page

const FactTopicSchema = z.enum([
  "concept",
  "behavior",
  "configuration",
  "terminology",
  "constraint",
  "edge_case",
  "integration",
  "api",
  "open_question",
  "accounting",
  "database",
  "business_event",
  "other",
]);

const ConfidenceLevelSchema = z.enum(["high", "medium", "low"]);
const FactStatusSchema = z.enum([
  "confirmed",
  "inferred",
  "conflicting",
  "open",
]);

export const ExtractedFactSchema = z.object({
  topic: FactTopicSchema,
  label: z
    .string()
    .describe(
      "A short identifier for this fact, e.g. 'Supported loan types' or 'Daily amortization formula'."
    ),
  content: z
    .string()
    .describe(
      "The full factual content. Include all relevant details, exact numbers, field names, formulas. Never paraphrase."
    ),
  confidence: ConfidenceLevelSchema.describe(
    "high = explicitly stated; medium = implied; low = unclear or ambiguous."
  ),
  status: FactStatusSchema.describe(
    "confirmed = clear and certain; inferred = assumed from context; conflicting = contradicts another fact; open = unresolved question."
  ),
});

export const ExtractedFactsSchema = z.object({
  facts: z
    .array(ExtractedFactSchema)
    .describe(
      "All facts extracted from the document. Be thorough — extract every concept, behavior, configuration option, constraint, API detail, accounting entry, database field, business event, and open question."
    ),
  examples: z
    .array(
      z.object({
        title: z.string().describe("Short title for the example or scenario."),
        scenario: z
          .string()
          .describe("Description of what situation this example covers."),
        steps: z.array(
          z.object({
            step: z.number(),
            description: z.string(),
          })
        ),
        result: z.string().describe("Expected outcome of the scenario."),
      })
    )
    .describe(
      "Worked examples, scenarios, or FAQs found in the document. Empty array if none."
    ),
});

export type ExtractedFactsOutput = z.infer<typeof ExtractedFactsSchema>;

// ─── Doc Section Generation ────────────────────────────────────────────────
// Used in Stage 5 to generate each documentation section

export const DocSectionSchema = z.object({
  content: z
    .string()
    .describe(
      "The full Markdown content for this documentation section. Use proper headings, lists, code blocks, and tables where appropriate. Write for the target audience."
    ),
});

export type DocSectionOutput = z.infer<typeof DocSectionSchema>;
