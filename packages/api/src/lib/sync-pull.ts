import { and, asc, eq, gt } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db/client";
import { syncEntities, type SyncEntityRow } from "@/db/schema";
import { ALWAYS_REPORTED_TYPES, toWireRow } from "./sync-envelope";
import { assertEntityType, assertEntityTypeCount } from "./sync-validation";
import type { SyncPullResponse } from "./sync-types";

export const DEFAULT_PULL_LIMIT = 500;
export const MIN_PULL_LIMIT = 1;
export const MAX_PULL_LIMIT = 2000;

const CURSOR_SUFFIX = "_cursor";

export function clampPullLimit(raw: string | null): number {
  const parsed = raw !== null ? Number(raw) : DEFAULT_PULL_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_PULL_LIMIT;
  return Math.min(MAX_PULL_LIMIT, Math.max(MIN_PULL_LIMIT, Math.trunc(parsed)));
}

export function parseCursor(raw: string | null): number {
  const parsed = raw !== null ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

/**
 * One cursor per entity type, read from `<type>_cursor` query params — any
 * type matching the entity-type pattern, so a new type needs no server
 * change. The shipped four are always included (cursor 0 when absent).
 */
export function parsePullCursors(params: URLSearchParams): Map<string, number> {
  const cursors = new Map<string, number>(ALWAYS_REPORTED_TYPES.map((t) => [t, 0]));
  for (const [name, value] of params) {
    if (!name.endsWith(CURSOR_SUFFIX)) continue;
    const entityType = name.slice(0, -CURSOR_SUFFIX.length);
    assertEntityType(entityType);
    cursors.set(entityType, parseCursor(value));
  }
  assertEntityTypeCount(cursors.size);
  return cursors;
}

/**
 * Pages each type by `rev` in one batch, so every type is read from the same
 * snapshot in a single round trip. Deleted rows are returned like any other
 * (with `deleted_at` set) so the delete propagates.
 */
export async function applyPull(
  userId: string,
  cursors: Map<string, number>,
  limit: number
): Promise<SyncPullResponse> {
  const types = [...cursors.entries()];
  const queries: BatchItem<"pg">[] = types.map(([entityType, cursor]) =>
    db
      .select()
      .from(syncEntities)
      .where(
        and(
          eq(syncEntities.userId, userId),
          eq(syncEntities.entityType, entityType),
          gt(syncEntities.rev, cursor)
        )
      )
      .orderBy(asc(syncEntities.rev))
      .limit(limit)
  );
  // ALWAYS_REPORTED_TYPES guarantees at least one query.
  const results = (await db.batch(
    queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]
  )) as SyncEntityRow[][];

  const response: SyncPullResponse = {};
  types.forEach(([entityType, cursor], i) => {
    const rows = results[i];
    response[entityType] = {
      rows: rows.map(toWireRow),
      next_cursor: rows.length > 0 ? rows[rows.length - 1].rev : cursor,
      has_more: rows.length === limit,
    };
  });
  return response;
}
