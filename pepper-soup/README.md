# Automated Documentation Pipeline

## Overview

This pipeline generates documentation from existing source material like Confluence pages, Excel files, and source code. It parses the sources, extracts facts using an LLM or scripts, merges them into a single knowledge base, and generates two output docs: `user.md` and `developer.md`.

The pipeline runs as **6 sequential stages**. Each stage consumes the output of the previous one.

---

## Usage

To run the pipeline, you can use the CLI and pass sources either via a `sources.json` configuration file.

**Example `sources.json`:**

```json
{
  "confluence": ["docs/confluence.md"],
  "excel": ["docs/data.xlsx"],
  "code": [
    { "dir": "../banking-core/src/main/java/com/bank/capitalized_income" }
  ]
}
```

**Run Commands:**

```bash
bun run index.ts capitalized_income --sources ./sources.json
```

---

## Pipeline Stages

```
Confluence + Excel + Code sources
        │
        ▼
1. Collect Sources        → copy raw content locally from different sources
        │
        ▼
2. Normalise Sources       → clean and standardise content
        │
        ▼
3. Extract Knowledge       → LLM or scripts extract facts/examples per source
        │
        ▼
4. Merge Knowledge Base    → dedupe, combine into one Knowledge Base
        │
        ▼
5. Generate Documentation  → LLM writes user.md and developer.md by section
        │
        ▼
6. Generate Review Report  → Generate local QA checklist
```

---

## Stage 1: Collect Sources

**Purpose:** Copy source content (Confluence markdown, Excel workbooks, and source code files) from their original locations locally.

**Why:** Keeps sources for each feature isolated, avoids mutating originals, and gives every downstream stage a fixed input path.

**Input:**

- `featureId` (e.g. `capitalised_income`)
- `sources.confluence` — array of file paths
- `sources.excel` — array of file paths
- `sources.code` — array of objects specifying `dir` and `include`/`exclude` patterns

**Output:**

```
sources/{featureId}/
├── confluence/*.md
├── excel/*.xlsx
└── code/*
```

**Skip:** `skipStages: [1]` — use if the folder is already populated.

---

## Stage 2: Normalise Sources

**Purpose:** Convert raw content into a consistent markdown format.

**Why:** Raw content carries navigation elements, embedded HTML, and inconsistent formatting. Normalising this before extraction improves the quality of Stage 3's output.

**Processing:**

- Clean up irrelevant information
- Retain substantive content
- Attach a metadata header ( `source_type`, `source_id`, `content_type`, `feature_id` )

**Output:**

```
normalised/{featureId}/
├── Document1.md
├── Document2.md
```

**Skip:** `skipStages: [2]`

---

## Stage 3: Extract Knowledge

**Purpose:** Use an LLM to extract structured facts and worked examples from each normalised source.

**Why:** Converts unstructured prose into discrete, queryable records — each with a topic, confidence level, and status — instead of leaving everything as freeform text.

**Markdown sources:** sent to the LLM with an extraction prompt; returns structured JSON.
**Excel sources:** handled separately by a Python script (`extract_excel.py`) that parses tables/scenarios into the same schema.
**Code sources:** sent to the LLM with a specific code extraction prompt. These code facts act as the **ground truth** to identify and fix missing, old, or conflicting information in the business documents.

**Fact schema:**

```typescript
{
  id: "fact_001",
  topic: "concept" | "behavior" | "configuration" | "database" | "api" | "accounting" | "edge_case" | "open_question" | ...,
  label: string,
  content: string,
  confidence: "high" | "medium" | "low",
  status: "confirmed" | "inferred" | "conflicting" | "open",
  provenance: { source_type, source_id, feature_id }
}
```

**Example schema:** `{ id, title, scenario, steps: [...], result, provenance }`

**Output:** one `.extract.json` file per source, e.g. `Document1.extract.json`

**Skip:** `skipStages: [3]`

---

## Stage 4: Merge Knowledge Base

**Purpose:** Combine all extraction files into a single knowledge base.

**Why:** Sources overlap. Without merging, the same fact would appear multiple times in the final docs, and contradictions between sources would go unnoticed.

**Dedup logic:** facts with matching topic + similar label are compared; the higher-confidence version is kept, the other is dropped.

**Output:** `knowledge-base/{featureId}.json`, containing:

- `facts[]`, `examples[]`
- `openQuestions[]` — facts where `topic === "open_question"`
- `conflicts[]` — facts where `status === "conflicting"`

**Skip:** `skipStages: [4]`

---

## Stage 5: Generate Documentation

**Purpose:** Generate `user.md` and `developer.md` from the knowledge base.

**Why split by audience:** users and developers need different information — usage/workflow vs. implementation/config/data model.

**Processing:** each doc is broken into sections; each section is generated independently. The LLM is instructed to prioritize the narrative and tone of the human-written Business Doc Facts, but to use Implementation (Code) Facts as the ultimate source of truth to correct any conflicting or outdated information. Sections are then concatenated into the final file.

**Output:**

```
docs/{featureId}/
├── user.md
└── developer.md
```

**Skip:** `skipStages: [5]`

---

## Stage 6: Generate Review Report

**Purpose:** Produce a QA checklist.

**Why:** Conflicts, open questions, and low-confidence facts need a human decision before publishing. This stage surfaces them without requiring a manual read-through of the full KB.

**Contents:**

- Summary table (fact/example/conflict counts)
- Conflicting facts (with both source references)
- Open questions
- Low-confidence facts (excluding open questions)

**Output:** `review/{featureId}.md`

```
# Review Report — capitalised_income

## Summary
|      Category     | Count |
|-------------------|-------|
| Total facts       | 120   |
| Open questions    | 5     |
| Conflicting facts | 2     |

## Conflicting Facts
[fact_045] How should capitalized income be amortized?
- Source: confluence:Document1 vs excel:Workbook2
```

**Skip:** `skipStages: [6]`

---

## Classification

- **Topics:** concept, behavior, configuration, database, api, business_event, accounting, edge_case, constraint, open_question, other
- **Confidence:** high (explicit in source) / medium (reasonable inference) / low (uncertain, needs verification)
- **Status:** confirmed / inferred / conflicting / open
- **Provenance:** every fact/example records `source_type`, `source_id`, `feature_id` for traceability back to the origin file.

---

## Workflow

1. Collect sources
2. Run the pipeline
3. Review `review/{featureId}.md` for flagged items
4. Resolve conflicts/open questions in the KB if needed
5. Regenerate docs from the updated KB
6. Publish `docs/{featureId}/user.md` and `developer.md`
