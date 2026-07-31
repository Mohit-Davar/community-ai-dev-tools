import express from "express";

import {
  getPage,
  getSources,
  search,
  syncSource,
} from "@/controllers/api.controller";

export const apiRouter = express.Router();

apiRouter.get("/page/:id", getPage);
apiRouter.get("/search", search);
apiRouter.get("/sources", getSources);
apiRouter.post("/sources/:id/sync", syncSource);
