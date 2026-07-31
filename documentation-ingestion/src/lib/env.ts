import { z } from "zod";

export const env = z
  .object({
    // Confluence
    CONFLUENCE_API_TOKEN: z.string().optional(),
    CONFLUENCE_BASE_URL: z.string().optional(),
    CONFLUENCE_EMAIL: z.string().optional(),
    // Database
    DATABASE_PATH: z.string().default("./data/docs.db"),
    // GitHub
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_WEBHOOK_SECRET: z.string().optional(),
    // Port
    PORT: z.coerce.number().default(3001),
  })
  .parse(process.env);
