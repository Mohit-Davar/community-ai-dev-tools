import express from "express";

import { handleConfluenceWebhook } from "@/controllers/confluence.ts";

export const confluenceWebhookRouter = express.Router();

confluenceWebhookRouter.post("/:sourceId", handleConfluenceWebhook);
