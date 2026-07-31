import "@/lib/db-client";

import express from "express";

import { env } from "@/lib/env";
import { apiRouter } from "@/routes/api.route";
import { webhooksRouter } from "@/webhooks/routes/index.ts";

const app = express();

// Webhook must come before express.json() as it uses express.raw() internally
app.use("/webhooks", webhooksRouter);
app.use(express.json());
app.use("/api", apiRouter);

app.listen(env.PORT, () => {
  console.log(`[ingestion] Server running at http://localhost:${env.PORT}`);
});
