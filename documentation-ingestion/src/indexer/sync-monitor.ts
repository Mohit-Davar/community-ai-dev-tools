import crypto from "crypto";

import { db } from "@/lib/db-client";

export type SyncTrigger = "webhook" | "schedule" | "manual";
export type SyncStatus = "started" | "success" | "error";

export interface SyncStats {
  pagesAdded: number;
  pagesRemoved: number;
  pagesUpdated: number;
}

export class SyncMonitor {
  private syncId: string;
  private startedAt: number;
  private stats: SyncStats = {
    pagesAdded: 0,
    pagesRemoved: 0,
    pagesUpdated: 0,
  };

  constructor(
    private readonly sourceId: string,
    private readonly triggeredBy: SyncTrigger
  ) {
    this.syncId = crypto.randomUUID();
    this.startedAt = Date.now();
  }

  start() {
    db.prepare(
      `
      INSERT INTO sync_log (id, source_id, triggered_by, status, started_at)
      VALUES (?, ?, ?, 'started', ?)
    `
    ).run(this.syncId, this.sourceId, this.triggeredBy, this.startedAt);
  }

  addStat(type: keyof SyncStats, count: number = 1) {
    this.stats[type] += count;
  }

  complete() {
    db.prepare(
      `
      UPDATE sync_log 
      SET status = 'success', 
          completed_at = ?,
          pages_added = ?,
          pages_updated = ?,
          pages_removed = ?
      WHERE id = ?
    `
    ).run(
      Date.now(),
      this.stats.pagesAdded,
      this.stats.pagesUpdated,
      this.stats.pagesRemoved,
      this.syncId
    );

    // Also update source last_synced_at
    db.prepare(`UPDATE sources SET last_synced_at = ? WHERE id = ?`).run(
      Date.now(),
      this.sourceId
    );
  }

  fail(error: Error) {
    db.prepare(
      `
      UPDATE sync_log 
      SET status = 'error', 
          completed_at = ?,
          error_message = ?
      WHERE id = ?
    `
    ).run(Date.now(), error.message, this.syncId);
  }
}
