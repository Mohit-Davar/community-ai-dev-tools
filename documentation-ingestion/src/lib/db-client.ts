import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { Database } from "bun:sqlite";

import { env } from "@/lib/env";

mkdirSync(dirname(env.DATABASE_PATH), {
  recursive: true,
});

export const db = new Database(env.DATABASE_PATH);

db.run(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
`);
