import type { Request, Response } from "express";

import { IndexerService } from "@/indexer/service.ts";
import { db } from "@/lib/db-client";

export async function handleConfluenceWebhook(req: Request, res: Response) {
  // Acknowledge immediately
  res.sendStatus(200);

  const { sourceId } = req.params;
  const source = db
    .prepare(
      `
        SELECT id, provider_id
        FROM sources
        WHERE id = ?
      `
    )
    .get(sourceId) as
    | {
        id: string;
        provider_id: string;
      }
    | undefined;

  if (!source || source.provider_id !== "confluence") {
    console.warn(
      `[Confluence] Unknown source '${sourceId}'. Ignoring webhook.`
    );
    return;
  }

  const payload = req.body;

  // Atlassian sends the event in a header
  const event =
    req.header("X-Atlassian-Webhook-Event") ?? payload?.eventType ?? "unknown";

  const page =
    payload.page ?? payload.content ?? payload.blog ?? payload.attachment;

  const pageId = page?.id?.toString();
  const title = page?.title;
  const spaceKey = page?.spaceKey;
  const version = page?.version;

  console.info("[Confluence]", {
    event,
    pageId,
    spaceKey,
    title,
    version,
  });

  const indexer = new IndexerService();

  try {
    switch (event) {
      case "page_created":
      case "page_updated":
      case "page_restored":
      case "blog_created":
      case "blog_updated":
      case "attachment_created":
      case "attachment_updated":
        if (pageId) {
          // Better approach
          await indexer.syncConfluencePage(sourceId, pageId);
        } else {
          // Payload incomplete
          await indexer.fullSync(sourceId, "webhook");
        }
        break;

      case "page_removed":
      case "page_trashed":
      case "blog_removed":
      case "attachment_removed":
        if (pageId) {
          await indexer.removeDocument(sourceId, pageId);
        } else {
          await indexer.fullSync(sourceId, "webhook");
        }
        break;

      default:
        console.info(`[Confluence] Ignoring unsupported event '${event}'.`);
    }
  } catch (error) {
    console.error("[Confluence] Failed to process webhook", error);
  }
}
