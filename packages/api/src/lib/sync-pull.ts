import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { recurringTasks, settings, tags, tasks } from "@/db/schema";
import {
  recurringTaskWireColumns,
  settingsWireColumns,
  tagWireColumns,
  taskWireColumns,
} from "./sync-columns";
import { fetchRecurringTaskTagIds, fetchTaskTagIds } from "./sync-tag-links";
import type { SyncPullTableResult } from "./sync-types";

export const DEFAULT_PULL_LIMIT = 500;
export const MIN_PULL_LIMIT = 1;
export const MAX_PULL_LIMIT = 2000;

export function clampPullLimit(raw: string | null): number {
  const parsed = raw !== null ? Number(raw) : DEFAULT_PULL_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_PULL_LIMIT;
  return Math.min(MAX_PULL_LIMIT, Math.max(MIN_PULL_LIMIT, Math.trunc(parsed)));
}

export function parseCursor(raw: string | null): number {
  const parsed = raw !== null ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

function toResult(rows: { rev: number }[], cursor: number, limit: number): SyncPullTableResult {
  const lastRev = rows.length > 0 ? rows[rows.length - 1].rev : cursor;
  return { rows, next_cursor: lastRev, has_more: rows.length === limit };
}

export async function pullRecurringTasks(
  userId: string,
  cursor: number,
  limit: number
): Promise<SyncPullTableResult> {
  const rows = await db
    .select(recurringTaskWireColumns)
    .from(recurringTasks)
    .where(and(eq(recurringTasks.userId, userId), gt(recurringTasks.rev, cursor)))
    .orderBy(asc(recurringTasks.rev))
    .limit(limit);

  const tagMap = await fetchRecurringTaskTagIds(
    userId,
    rows.map((r) => r.id)
  );
  const withTags = rows.map((row) => ({ ...row, tag_ids: tagMap.get(row.id) ?? [] }));

  return toResult(withTags, cursor, limit);
}

export async function pullTasks(
  userId: string,
  cursor: number,
  limit: number
): Promise<SyncPullTableResult> {
  const rows = await db
    .select(taskWireColumns)
    .from(tasks)
    .where(and(eq(tasks.userId, userId), gt(tasks.rev, cursor)))
    .orderBy(asc(tasks.rev))
    .limit(limit);

  const tagMap = await fetchTaskTagIds(
    userId,
    rows.map((r) => r.id)
  );
  const withTags = rows.map((row) => ({ ...row, tag_ids: tagMap.get(row.id) ?? [] }));

  return toResult(withTags, cursor, limit);
}

export async function pullSettings(
  userId: string,
  cursor: number,
  limit: number
): Promise<SyncPullTableResult> {
  const rows = await db
    .select(settingsWireColumns)
    .from(settings)
    .where(and(eq(settings.userId, userId), gt(settings.rev, cursor)))
    .orderBy(asc(settings.rev))
    .limit(limit);

  return toResult(rows, cursor, limit);
}

export async function pullTags(
  userId: string,
  cursor: number,
  limit: number
): Promise<SyncPullTableResult> {
  const rows = await db
    .select(tagWireColumns)
    .from(tags)
    .where(and(eq(tags.userId, userId), gt(tags.rev, cursor)))
    .orderBy(asc(tags.rev))
    .limit(limit);

  return toResult(rows, cursor, limit);
}
