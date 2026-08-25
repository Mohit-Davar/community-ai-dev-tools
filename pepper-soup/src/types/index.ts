// Normalised Document
export type SourceType = "confluence" | "excel" | "code";
export type ContentType = "page" | "scenario" | "table" | "source_code";

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

// Knowledge Base
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

// Identifies where a fact or example came from.
export interface Provenance {
  source_type: SourceType;
  source_id: string;
  feature_id: string;
  // Optional: set when the item comes from a batched LLM call.
  batch_id?: string;
  // Optional: relative file path for code-sourced items.
  file_path?: string;
  // Optional: section heading within the source document.
  section?: string;
}

// A piece of information extracted from the source documents.
export interface Fact {
  id: string;
  topic: FactTopic;
  label: string;
  content: string;
  confidence: ConfidenceLevel;
  status: FactStatus;
  provenance: Provenance;
  all_provenances?: Provenance[];
}

// A step in an example scenario.
export interface ExampleStep {
  step: number;
  description: string;
}

// Example scenario extracted from the source documents.
export interface Example {
  id: string;
  title: string;
  scenario: string;
  steps: ExampleStep[];
  result: string;
  provenance: Provenance;
  all_provenances?: Provenance[];
}

// Stores all extracted knowledge for a feature.
export interface FeatureKnowledgeBase {
  featureId: string;
  generatedAt: string; // ISO timestamp
  facts: Fact[];
  examples: Example[];
  openQuestions: Fact[]; // facts with topic === "open_question"
  conflicts: Fact[]; // facts with status === "conflicting"
}

// Document Generation
export type DocType = "developer" | "user";
export type OutputPlatform = "gitbook" | "confluence";

export interface DocSection {
  title: string;
  content: string;
}

// Defines a codebase directory and optional filters.
export interface CodeSourceInput {
  dir: string; // codebase directory
  include?: string[]; // files to include
  exclude?: string[]; // files to exclude
  search?: string[]; // content patterns to search for
}

// Defines all sources used by the pipeline.
export interface PipelineSourcesInput {
  confluence: string[]; // .md files
  excel: string[]; // .xlsx files
  code: CodeSourceInput[]; // codebase directories
}

// Options used when running the pipeline.
export interface PipelineRunOptions {
  featureId: string;
  sources: PipelineSourcesInput;
  skipStages?: number[]; // stages to skip, e.g. [1, 2]
}

// Stage Specific Types

export interface ReviewStats {
  totalFacts: number;
  examplesCount: number;
  conflictsCount: number;
  openQuestionsCount: number;
  lowConfidenceCount: number;
  reportPath: string;
}

export interface ExtractedData {
  meta: NormalisedDocMeta;
  facts: Fact[];
  examples: Example[];
}

export interface PageGroup {
  title: string;
  slug: string;
  subDir: string;
  sections: Array<{
    title: string;
    topics: FactTopic[];
  }>;
  includeExamples: boolean;
}

export interface WrittenPage {
  title: string;
  subDir: string;
  slug: string;
}

export interface GeneratedDoc {
  overviewBody: string;
  pages: Array<{
    group: PageGroup;
    body: string;
  }>;
}

export interface BatchItem {
  sourceId: string;
  content: string;
}

export interface RawExtractedFact {
  source_item_id: string;
  section: string | null;
  topic: string;
  label: string;
  content: string;
  confidence: string;
  status: string;
}

export interface RawExtractedExample {
  source_item_id: string;
  section: string | null;
  title: string;
  scenario: string;
  steps: { step: number; description: string }[];
  result: string;
}

export interface ProvenanceWarning {
  batchId: string;
  kind: "fact" | "example";
  index: number;
  problems: string[];
}

export interface CollectSourcesResult {
  confluenceCount: number;
  excelCount: number;
  codeFilesCount: number;
}
