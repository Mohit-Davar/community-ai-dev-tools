import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

import { IndexerService } from "@/indexer/service.ts";
import { env } from "@/lib/env";

export function verifyGitHubSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature) {
    return res.status(401).send("No signature found");
  }
  const hmac = crypto.createHmac("sha256", env.GITHUB_WEBHOOK_SECRET!);
  const digest = "sha256=" + hmac.update(req.body).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send("Invalid signature");
  }
  next();
}

export function handleGitHubWebhook(req: Request, res: Response) {
  // ACK immediately
  res.status(200).send("ok");
  const event = req.headers["x-github-event"];
  if (event === "push") {
    const payload = JSON.parse(req.body.toString());
    const owner = payload.repository?.owner?.login || payload.repository?.owner?.name;
    const repo = payload.repository?.name;
    const commits = payload.commits || [];
    if (owner && repo) {
      const indexer = new IndexerService();
      void indexer.handleGitHubPush(owner, repo, commits);
    }
  }
}
