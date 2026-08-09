// ─── Normalised Document ───────────────────────────────────────────────────

export type SourceType = "confluence" | "excel";
export type ContentType = "page" | "scenario" | "table";

export interface NormalisedDocMeta {
  source_type: SourceType;
  source_id: string; // filename without extension
  source_url?: string;
  content_type: ContentType;
  feature_id: string;
}

export interface NormalisedDoc {
  meta: NormalisedDocMeta;
  content: string; // clean Markdown body
  filePath: string; // path to the written .md file
}

// ─── Knowledge Base ────────────────────────────────────────────────────────

export type FactTopic =
  | "concept"
  | "behavior"
  | "configuration"
  | "terminology"
  | "constraint"
  | "edge_case"
  | "integration"
  | "api"
  | "open_question"
  | "accounting"
  | "database"
  | "business_event"
  | "other";

export type ConfidenceLevel = "high" | "medium" | "low";
export type FactStatus = "confirmed" | "inferred" | "conflicting" | "open";

export interface Provenance {
  source_type: SourceType;
  source_id: string;
  feature_id: string;
}

export interface Fact {
  id: string;
  topic: FactTopic;
  label: string;
  content: string;
  confidence: ConfidenceLevel;
  status: FactStatus;
  provenance: Provenance;
}

export interface ExampleStep {
  step: number;
  description: string;
}

export interface Example {
  id: string;
  title: string;
  scenario: string;
  steps: ExampleStep[];
  result: string;
  provenance: Provenance;
}

export interface FeatureKnowledgeBase {
  featureId: string;
  generatedAt: string; // ISO timestamp
  facts: Fact[];
  examples: Example[];
  openQuestions: Fact[]; // facts with topic === "open_question"
  conflicts: Fact[]; // facts with status === "conflicting"
}

// ─── Doc Generation ────────────────────────────────────────────────────────

export type DocType = "developer" | "user";

export interface DocSection {
  title: string;
  content: string;
}

// ─── Pipeline Run Config ───────────────────────────────────────────────────

export interface PipelineSourcesInput {
  confluence: string[]; // absolute paths to .md files
  excel: string[]; // absolute paths to .xlsx files
}

export interface PipelineRunOptions {
  featureId: string;
  sources: PipelineSourcesInput;
  skipStages?: number[]; // e.g. [1, 2] to skip collect + normalise
}
