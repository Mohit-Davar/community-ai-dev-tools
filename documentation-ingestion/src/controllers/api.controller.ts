import type { Request, Response } from "express";
import { z } from "zod";

import { IndexerService } from "@/indexer/service";
import {
  getPageByIdQuery,
  getSourceByIdQuery,
  getSourcesQuery,
  searchQuery,
} from "@/models/api.model";

export function getPage(req: Request, res: Response) {
  const result = z
    .object({ id: z.string().min(1, "Page ID is required") })
    .safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      details: result.error.flatten(),
      error: "Invalid request",
    });
  }

  const pageId = result.data.id;
  const data = getPageByIdQuery(pageId);
  if (!data) {
    return res.status(404).json({ error: "Page not found" });
  }

  return res.json(data);
}

export function search(req: Request, res: Response) {
  const result = z
    .object({
      audience: z.string().optional(),
      limit: z.coerce.number().int().positive().max(100).default(20),
      q: z.string().trim().min(1, "Query parameter is required"),
      source: z.string().optional(),
    })
    .safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      details: result.error.flatten(),
      error: "Invalid query parameters",
    });
  }

  const { audience, limit, q, source } = result.data;
  const results = searchQuery({ audience, limit, q, source });

  return res.json({ results });
}

export function getSources(_: Request, res: Response) {
  const sources = getSourcesQuery();

  res.status(200).json({ sources });
}

export function syncSource(req: Request, res: Response) {
  const result = z
    .object({ id: z.string().min(1, "Source ID is needed.") })
    .safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      details: result.error.flatten(),
      error: "Invalid request",
    });
  }

  const sourceId = result.data.id;
  const source = getSourceByIdQuery(sourceId);
  if (!source) {
    return res.status(404).json({ error: "Source not found" });
  }

  // Run async
  const indexer = new IndexerService();
  void indexer.fullSync(sourceId, "manual");

  res.status(200).json({ status: "sync_started" });
}
