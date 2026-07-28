# Repo Owl

A GitHub Action that provides **AI-powered PR security reviews** and **Automated Documentation Updates**. It runs on pull requests to flag security vulnerabilities, and on pushes to `main` to automatically update your GitBook and ReadMe documentation via GitHub Sync. It is easily configurable using a simple `.repoowl.yml` file.

### Summary View

<img src="docs/summary.png" width="500" />

### Inline Comments

<img src="docs/comment.png" width="500" />

---

## Table of Contents

1. [Features](#features)
2. [How It Works](#how-it-works)
3. [Setup & Usage](#setup--usage)
   - [GitHub Actions Workflow](#1-github-actions-workflow)
   - [Inputs & Secrets](#2-inputs--secrets)
4. [Configuration (`.repoowl.yml`)](#configuration-reviewowlyml)
5. [Local Development & Contribution](#local-development--contribution)
   - [Prerequisites](#prerequisites)
   - [Available Scripts](#available-scripts)
   - [Code Quality & Linting](#code-quality--linting)
   - [Building for Release](#building-for-release)

---

## Features

### 🛡️ Security Reviews

- **Three-Stage Analysis**:
  1. **Dependency Scanning**: Checks changed dependencies against the [OSV database](https://osv.dev/) for known vulnerabilities.
  2. **Static Regex Scan**: Detects exposed secrets, keys, and unsafe function usage.
  3. **LLM-based Review**: Uses LLM model to review full diff context, validate findings, and detect deeper issues.
- **Inline PR Comments**: Adds findings directly to relevant lines in the pull request.
- **Noise Reduction**: Skips lockfiles, binaries, and generated assets to reduce irrelevant results.

### 📚 Automated Documentation Updates

- **AI-Powered Discovery**: Evaluates code changes and automatically identifies which documentation files need updates.
- **Centralized Docs Support**: Designed to push updates to a centralized docs monorepo using GitHub Sync for GitBook and ReadMe.
- **Audience Filtering**: Only updates documentation relevant to the impacted audience (e.g., developers vs. end-users).

### ⚙️ Configurable Behavior

- Easily adjust this tool for your project using `.repoowl.yml`, like adding your own security rules, configuring documentation paths, and selecting the LLM model.

---

## How It Works

![Architechure Diagram](docs/architecture.png)

1. **Trigger & Fetch**: Runs on `pull_request` events and fetches the raw git diff from the GitHub API using `@actions/github` and `@octokit/rest`.
2. **Parsing & Filtering ([parse.ts](src/features/pr/git-diff/parse.ts))**: The diff is structured using `parse-diff`. It ignores common system/binary extensions (like images, PDFs, maps) and lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `bun.lockb`, etc.).
3. **Dependency Scanning ([check-vulnerabilities.ts](src/features/pr/cve-detection/check-vulnerabilities.ts))**: Extracts changed packages from dependency files and queries **Open Source Vulnerabilities (OSV)** for known issues.
4. **Static Analysis ([engine.ts](src/features/pr/security-engine/engine.ts))**: Runs regex checks for secrets, API keys, and unsafe patterns like `eval()`.
5. **LLM Review ([review.ts](src/features/pr/llm-call/review.ts))**: Sends diff data, CVEs, and static findings to the model for validation and deeper analysis.
6. **Commenting ([octokit](src/features/pr/octokit))**: Groups results and posts them as PR comments via Octokit.

---

## Setup & Usage

### 1. GitHub Actions Workflow

Create a file named `.github/workflows/security-review.yml` in your repository:

```yaml
name: Repo Owl

on:
  push:
    branches:
      - main # Required for automated documentation updates
  pull_request:
    types: [opened, synchronize, reopened] # Required for security reviews

jobs:
  repo-owl:
    name: Run Repo Owl
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write # Required for inline code comments
      issues: write # Required for the main PR summary comment

    steps:
      - name: Run Repo Owl
        uses: Mohit-Davar/community-ai-dev-tools@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Required for Centralized Docs updates (Must be a PAT with write access to the docs repo)
          docs-github-token: ${{ secrets.DOCS_GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### 2. Inputs & Secrets

| Input               | Description                                                | Required | Default / Note                        |
| :------------------ | :--------------------------------------------------------- | :------: | :------------------------------------ |
| `github-token`      | GitHub token used to fetch the PR diff and write comments. | **Yes**  | Usually `${{ secrets.GITHUB_TOKEN }}` |
| `openai-api-key`    | API key for LLM-based analysis                             | **Yes**  | Save in repository **Secrets**        |
| `docs-github-token` | PAT used to push documentation updates to remote repos.    |    No    | Required if using remote docs repo    |

---

## Configuration (`.repoowl.yml`)

You can control behavior using a `.repoowl.yml` file:

```yaml
# ==========================================
# 1. DOCUMENTATION UPDATES CONFIGURATION
# ==========================================
documentation:
  enabled: true
  documents:
    # Example: Push to a centralized docs repo (GitBook Sync)
    - platform: gitbook
      repo: "meta/meta-docs" # The central docs repo
      path: "docs/whatsapp/customers/read.md" # Directory path in the central repo
      audience: user
      purpose: "End-user guides for WhatsApp"

    # Example: Update ReadMe docs via GitHub Sync
    - platform: readme
      repo: "meta/meta-docs"
      path: "docs/whatsapp/developers/api/"
      audience: developer
      purpose: "Technical API references"

# ==========================================
# 2. PR SECURITY REVIEW CONFIGURATION
# ==========================================
review:
  model: "gpt-5-mini"

  files:
    exclude:
      - "**/tests/**"
      - "docs/**"

  security:
    rules:
      - id: "slack-webhook"
        description: "Slack webhook URL detected. Avoid committing tokens."
        pattern: "https://hooks\\.slack\\.com/services/T[A-Z0-9_]+/B[A-Z0-9_]+/[A-Za-z0-9_]+"
        severity: "high"
        fileExtensions:
          - ".ts"
          - ".js"
```

### Configuration Options Reference

- **`model`**: LLM model used for review.
- **`ignore`**: Appended to the default ignored file patterns.
- **`filesToScan`**: If defined, only files matching these globs will be reviewed.
- **`rules`**: Custom regex rules. Each rule requires:
  - `id`: A unique string identifier.
  - `description`: The feedback message posted to the PR if triggered.
  - `pattern`: A RegExp string pattern to match.
  - `severity`: `"high"`, `"medium"`, or `"low"`.
  - `fileExtensions` (optional): Limits the rule to specific extensions.

---

## Local Development & Contribution

We welcome contributions! Please follow the steps below to set up your local development environment.

### Prerequisites

Uses [Bun](https://bun.sh/).

1. Install Bun:
   ```bash
   curl -fsSL https://bun.sh/install | bash  # macOS/Linux
   # For Windows, check: https://bun.sh/docs/installation
   ```
2. Clone and install:
   ```bash
   git clone <Repo_URL>
   cd <Repo_Name>
   bun install
   ```

### Available Scripts

- **Development Mode**:
  ```bash
  bun run dev
  ```
- **Run Once**:
  ```bash
  bun run start
  ```
- **Lint Code**:
  ```bash
  bun run lint
  ```
- **Format & Fix**:
  ```bash
  bun run fix
  ```

### Code Quality & Linting

Uses ESLint and Prettier. Run `bun run fix` before committing. Checks run via `husky` and `lint-staged`.

### Build for Release

Before submitting a Pull Request, ensure that the compiled distribution code is up to date:

```bash
bun run build
```

This compiles `src/index.ts` to `dist/index.js` targeting Node.js, which is the entry point used by the GitHub Action environment. Ensure the changes to `dist/` are staged and committed.
