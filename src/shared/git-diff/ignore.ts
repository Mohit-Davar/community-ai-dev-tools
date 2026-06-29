import { getConfig } from "@src/shared/config";
import { minimatch } from "minimatch";

export const DEFAULT_IGNORED_PATTERNS = [
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.svg",
  "*.ico",
  "*.pdf",
  "*.mp3",
  "*.mp4",
  "*.map",
  "package-lock.json",
  "pnpm-lock.yaml",
  "bun.lockb",
  "go.sum",
  "Cargo.lock",
  "Gemfile.lock",
  "composer.lock",
];

export function isIgnoredFile(fileName: string): boolean {
  const config = getConfig();
  const ignoredPatterns = [
    ...DEFAULT_IGNORED_PATTERNS,
    ...(config.review?.files?.exclude || []),
  ];

  return ignoredPatterns.some((p) =>
    minimatch(fileName, p, { matchBase: true })
  );
}

export function matchesScanPatterns(fileName: string): boolean {
  const config = getConfig();
  const scanPatterns = config.review?.files?.include || [];

  if (scanPatterns.length === 0) {
    return true; // If no specific patterns to scan, include everything not ignored
  }

  return scanPatterns.some((p) => minimatch(fileName, p));
}
