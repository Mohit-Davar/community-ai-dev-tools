import express from "express";

import {
  handleGitHubWebhook,
  verifyGitHubSignature,
} from "@/controllers/github.ts";

export const githubWebhookRouter = express.Router();

githubWebhookRouter.post(
  "/",
  express.raw({ limit: "10mb", type: "application/json" }),
  verifyGitHubSignature,
  handleGitHubWebhook
);
