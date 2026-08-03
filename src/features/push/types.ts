import type { selectDocuments } from "@src/features/push/select-documents";

export type ProcessResult =
  | {
      doc: Awaited<ReturnType<typeof selectDocuments>>[number];
      status: "published";
      url: string;
    }
  | {
      doc: Awaited<ReturnType<typeof selectDocuments>>[number];
      reason: string;
      status: "skipped";
    }
  | {
      doc: Awaited<ReturnType<typeof selectDocuments>>[number];
      error: Error;
      status: "failed";
    };
