import { and, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db/client";
import { syncEntities, type SyncEntityRow } from "@/db/schema";
import { ALWAYS_REPORTED_TYPES, toWireRow } from "./sync-envelope";
import type { SyncPushBatch, SyncPushResponse, SyncPushRow } from "./sync-types";

function upsert(userId: string, entityType: string, rows: SyncPushRow[]) {
  return db
    .insert(syncEntities)
    .values(
      rows.map((r) => ({
        userId,
        entityType,
        id: r.id,
        payload: r.payload,
        updatedAt: r.updatedAt,
        deletedAt: r.deletedAt,
      }))
    )
    .onConflictDoUpdate({
      target: [syncEntities.userId, syncEntities.entityType, syncEntities.id],
      set: {
        // Shallow merge: keys the pushing client didn't send (e.g. a field
        // only a newer client knows) survive; an explicit null clears one.
        payload: sql`${syncEntities.payload} || excluded.payload`,
        updatedAt: sql`excluded.updated_at`,
        deletedAt: sql`excluded.deleted_at`,
        rev: sql`nextval('sync_entities_rev_seq')`,
      },
      // Row-level last-write-wins on the client clock; a tie goes to the
      // incoming row so a retried push is idempotent.
      where: sql`excluded.updated_at >= ${syncEntities.updatedAt}`,
    })
    .returning({ id: syncEntities.id });
}

function readBack(userId: string, entityType: string, ids: string[]) {
  return db
    .select()
    .from(syncEntities)
    .where(
      and(
        eq(syncEntities.userId, userId),
        eq(syncEntities.entityType, entityType),
        inArray(syncEntities.id, ids)
      )
    );
}

/**
 * Applies a push in one transaction (neon-http runs `db.batch` as a single
 * non-interactive transaction): a per-user advisory lock first, so pushes
 * for one user serialize and their revs commit in order — otherwise a pull
 * could advance its cursor past a lower rev still uncommitted — then one
 * upsert per type, then a read-back of every pushed id. Rows the upsert
 * didn't return lost the last-write-wins check and are reported as
 * rejected along with the server's current version.
 */
export async function applyPush(userId: string, batch: SyncPushBatch): Promise<SyncPushResponse> {
  const response: SyncPushResponse = {};
  for (const entityType of [...ALWAYS_REPORTED_TYPES, ...batch.keys()]) {
    response[entityType] = { applied: [], rejected: [] };
  }

  const types = [...batch.entries()].filter(([, rows]) => rows.length > 0);
  if (types.length === 0) return response;

  const lock = db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
  const upserts = types.map(([entityType, rows]) => upsert(userId, entityType, rows));
  const readBacks = types.map(([entityType, rows]) =>
    readBack(userId, entityType, rows.map((r) => r.id))
  );
  const queries: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [lock, ...upserts, ...readBacks];
  const results = (await db.batch(queries)) as unknown[];

  types.forEach(([entityType], i) => {
    const applied = (results[1 + i] as { id: string }[]).map((r) => r.id);
    const appliedSet = new Set(applied);
    const current = results[1 + types.length + i] as SyncEntityRow[];
    response[entityType] = {
      applied,
      rejected: current
        .filter((row) => !appliedSet.has(row.id))
        .map((row) => ({ id: row.id, server_row: toWireRow(row) })),
    };
  });
  return response;
}
