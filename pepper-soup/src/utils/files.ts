import fs from "fs/promises";
import path from "path";

// Ensures a directory exists, creating it (and all parents) if not.
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

// Copies a file to destDir, preserving the basename.
// Returns the destination path.
export async function copyFileTo(
  srcPath: string,
  destDir: string
): Promise<string> {
  await ensureDir(destDir);
  const basename = path.basename(srcPath);
  const destPath = path.join(destDir, basename);
  await fs.copyFile(srcPath, destPath);
  return destPath;
}

// Reads a file as UTF-8 text.
export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

// Writes UTF-8 text to a file, creating parent dirs as needed.
export async function writeText(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

// Writes a JSON object to a file, pretty-printed.
export async function writeJson(
  filePath: string,
  data: unknown
): Promise<void> {
  await writeText(filePath, JSON.stringify(data, null, 2));
}

// Reads and parses a JSON file.
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const text = await readText(filePath);
  return JSON.parse(text) as T;
}

// Lists all files in a directory (non-recursive) with a given extension.
export async function listFiles(
  dirPath: string,
  ext?: string
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(
        (e) =>
          e.isFile() &&
          (ext === undefined ||
            e.name.toLowerCase().endsWith(ext.toLowerCase()))
      )
      .map((e) => path.join(dirPath, e.name));
  } catch {
    return [];
  }
}

// Generates a deterministic short ID from a string (for fact/example IDs).
export function makeId(prefix: string, index: number): string {
  return `${prefix}_${String(index).padStart(4, "0")}`;
}

// Slugifies a string to use as a safe filename segment.
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
