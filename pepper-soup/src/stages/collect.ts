import path from "path";
import micromatch from "micromatch";
import { readFile, copyFile } from "fs/promises";

import {
  confluenceSourcesDir,
  excelSourcesDir,
  codeSourcesDir,
} from "@/config/index";
import { copyFileTo, listFilesRecursive, ensureDir } from "@/utils/files";
import type { PipelineSourcesInput, CollectSourcesResult } from "@/types/index";

// Converts a search string ("Loan" or "/Loan/i") into a RegExp.
function createSearchRegex(pattern: string): RegExp {
  const literal = pattern.match(/^\/(.+)\/([dgimsuvy]*)$/);
  if (literal) {
    const [, source, flags] = literal;
    if (!source || flags === undefined) {
      throw new Error(`Invalid regex search pattern: ${pattern}`);
    }
    try {
      // Remove "g" because the regex is reused across multiple files.
      return new RegExp(source, flags.replace("g", ""));
    } catch (error) {
      throw new Error(
        `Invalid regex search pattern "${pattern}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  // Escape special regex characters for literal text search.
  return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

export async function collectSources(
  featureId: string,
  sources: PipelineSourcesInput,
  onProgress?: (msg: string) => void
): Promise<CollectSourcesResult> {
  const confluenceFiles = sources.confluence ?? [];
  const excelFiles = sources.excel ?? [];
  const codeSources = sources.code ?? [];

  // Collect Confluence documents
  for (const [i, file] of confluenceFiles.entries()) {
    onProgress?.(
      `Collecting Confluence source [${i + 1}/${confluenceFiles.length}]: ${path.basename(file)}...`
    );
    await copyFileTo(file, confluenceSourcesDir(featureId));
  }

  // Collect Excel spreadsheets
  for (const [i, file] of excelFiles.entries()) {
    onProgress?.(
      `Collecting Excel source [${i + 1}/${excelFiles.length}]: ${path.basename(file)}...`
    );
    await copyFileTo(file, excelSourcesDir(featureId));
  }

  // Collect Codebase sources
  const codeDir = codeSourcesDir(featureId);
  let totalCodeFiles = 0;

  for (const [i, { dir, include, exclude, search }] of codeSources.entries()) {
    const dirName = path.basename(dir);
    onProgress?.(
      `Scanning codebase [${i + 1}/${codeSources.length}]: ${dirName}...`
    );

    // Discover all files and build relative-path entries
    const allFiles = await listFilesRecursive(dir);
    let matches = allFiles.map((abs) => ({
      abs,
      rel: path.relative(dir, abs).replace(/\\/g, "/"),
    }));

    // Filter by include patterns (if provided), otherwise keep all files
    if (include?.length) {
      matches = matches.filter((e) => micromatch.isMatch(e.rel, include));
    }

    // Filter out excluded files
    if (exclude?.length) {
      matches = matches.filter((e) => !micromatch.isMatch(e.rel, exclude));
    }

    // Filter by content search patterns (if provided)
    if (search?.length) {
      onProgress?.(
        `Searching content in ${matches.length} code files from ${dirName}...`
      );
      let regexes: RegExp[];
      try {
        regexes = search.map((s) => createSearchRegex(s));
      } catch (error) {
        console.error(
          `[collectSources] Failed to create search regex: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        throw error;
      }
      const searched = await Promise.all(
        matches.map(async (file) => {
          try {
            const content = await readFile(file.abs, "utf-8");
            return regexes.some((rx) => rx.test(content)) ? file : null;
          } catch {
            return null; // Ignore files that cannot be read
          }
        })
      );
      matches = searched.filter((f): f is NonNullable<typeof f> => f !== null);
    }

    // Copy matched code files maintaining folder structure
    onProgress?.(
      `Copying ${matches.length} matched code files from ${dirName}...`
    );
    const destination = path.join(codeDir, dirName);
    for (const { abs, rel } of matches) {
      const target = path.join(destination, rel);
      await ensureDir(path.dirname(target));
      await copyFile(abs, target);
    }
    totalCodeFiles += matches.length;
  }

  return {
    confluenceCount: confluenceFiles.length,
    excelCount: excelFiles.length,
    codeFilesCount: totalCodeFiles,
  };
}
