import * as fs from "node:fs";
import * as path from "node:path";

import * as core from "@actions/core";
import type { Config } from "@src/shared";
import yaml from "yaml";
import { z } from "zod";

// Supported documentation audiences.
const AudienceSchema = z.enum(["user", "implementor", "developer"]);

// Fields shared by all documentation platforms.
const BaseDocumentSchema = {
  audience: AudienceSchema,
  enabled: z.boolean().optional(),
  purpose: z.string(),
};

// Platform-specific document definitions.
const DocumentConfigSchema = z.discriminatedUnion("platform", [
  z.object({
    ...BaseDocumentSchema,
    id: z.string(),
    platform: z.literal("gitbook"),
  }),
  z.object({
    ...BaseDocumentSchema,
    platform: z.literal("readme"),
    slug: z.string(),
  }),
  z.object({
    ...BaseDocumentSchema,
    pageId: z.string(),
    platform: z.literal("confluence"),
  }),
]);

// RepoPilot configuration schema.
export const ConfigSchema = z.object({
  documentation: z
    .object({
      documents: z.array(DocumentConfigSchema),
      enabled: z.boolean().optional(),
    })
    .optional(),
  review: z
    .object({
      files: z
        .object({
          exclude: z.array(z.string()).optional(),
          include: z.array(z.string()).optional(),
        })
        .optional(),
      model: z.string().optional(),
      security: z
        .object({
          dependencyFiles: z.array(z.string()).optional(),
          rules: z.array(z.any()).optional(),
        })
        .optional(),
    })
    .optional(),
});
// Cache configuration so it is loaded only once.
let cachedConfig: Config | undefined;
// Load and validate .repoowl.yml.
export function loadConfig(workspacePath: string | undefined): Config {
  // No workspace available.
  if (!workspacePath) {
    core.warning("No workspace path provided. Using default configuration.");
    cachedConfig = {};
    return cachedConfig;
  }
  // Return cached configuration.
  if (cachedConfig) {
    return cachedConfig;
  }
  const configPath = path.join(workspacePath, ".repoowl.yml");
  // Configuration file is optional.
  if (!fs.existsSync(configPath)) {
    core.info("No .repoowl.yml found. Using default configuration.");
    cachedConfig = {};
    return cachedConfig;
  }
  // Read and validate configuration.
  try {
    const fileContent = fs.readFileSync(configPath, "utf8");
    const parsedYaml = yaml.parse(fileContent);
    cachedConfig = ConfigSchema.parse(parsedYaml);
    core.info(`Loaded configuration from ${configPath}`);
    return cachedConfig;
  } catch (error) {
    throw new Error(`Invalid configuration in ${configPath}`, { cause: error });
  }
}

// Get configuration, loading it if necessary.
export function getConfig(): Config {
  return cachedConfig ?? loadConfig(process.env["GITHUB_WORKSPACE"]);
}
