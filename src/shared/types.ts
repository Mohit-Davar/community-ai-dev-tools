import type { SecurityRule } from "@src/features/pr/security-engine";

// Documentation audiences that can be targeted for updates.
export type DocAudience = "user" | "implementor" | "developer";
// Shared fields for all documentation platforms.
export interface BaseDocument {
  audience: DocAudience;
  enabled?: boolean;
  purpose: string;
}
// GitBook page configuration.
export interface GitBookDocument extends BaseDocument {
  id: string;
  platform: "gitbook";
}
// ReadMe page configuration.
export interface ReadMeDocument extends BaseDocument {
  platform: "readme";
  slug: string;
}
// Confluence page configuration.
export interface ConfluenceDocument extends BaseDocument {
  pageId: string;
  platform: "confluence";
}
// Supported documentation targets.
export type DocumentConfig =
  | GitBookDocument
  | ReadMeDocument
  | ConfluenceDocument;
// Files included or excluded from review.
export interface ReviewFilesConfig {
  exclude?: string[];
  include?: string[];
}
// Security review configuration.
export interface ReviewSecurityConfig {
  // Dependency lock files monitored for CVE scanning.
  dependencyFiles?: string[];
  // Custom security detection rules.
  rules?: SecurityRule[];
}
// Pull request review configuration.
export interface ReviewConfig {
  files?: ReviewFilesConfig;
  // LLM model used for review generation.
  model?: string;
  security?: ReviewSecurityConfig;
}
// Documentation update configuration.
export interface DocumentationConfig {
  documents: DocumentConfig[];
  enabled?: boolean;
}
// Root RepoPilot configuration.
export interface Config {
  documentation?: DocumentationConfig;
  review?: ReviewConfig;
}
// Credentials supplied through GitHub Action inputs.
export interface PlatformCredentials {
  confluence?: {
    apiToken: string;
    baseUrl: string;
    username: string;
  };
  gitbook?: {
    token: string;
  };
  readme?: {
    apiKey: string;
  };
}
// HTTP/API errors that expose a status code.
export interface ErrorWithStatus extends Error {
  status: number;
}
