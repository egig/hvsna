import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";
import type {
  RecurringTaskWireRow,
  SettingsWireRow,
  TaskWireRow,
} from "@/infra/sync/types";

export type SyncTable = "tasks" | "recurring_tasks" | "settings";

/**
 * Column lists mirror the sqlite base migration exactly (see
 * modules/sqlite/migrations/user/0000_rainy_brother_voodoo.sql) — wire rows
 * are snake_case with the same field names as these columns, so no mapping
 * layer is needed between a dirty-row scan and a push request body, or
 * between a pulled row and a local upsert.
 */
const TABLE_COLUMNS: Record<SyncTable, readonly string[]> = {
  tasks: [
    "id",
    "name",
    "description",
    "status",
    "at_time",
    "at_epoch_millis",
    "lat",
    "lng",
    "timezone",
    "recurring_type",
    "recurring_interval",
    "recurring_task_id",
    "hijri_date_offset",
    "tags",
    "created_at",
    "updated_at",
    "completed_at",
    "deleted_at",
  ],
  recurring_tasks: [
    "id",
    "name",
    "description",
    "recurring_type",
    "recurring_interval",
    "base_date_epoch",
    "at_time",
    "lat",
    "lng",
    "timezone",
    "hijri_date_offset",
    "tags",
    "recurring_end",
    "recurring_end_epoch",
    "recurring_end_occurrences",
    "use_gregorian",
    "occurrence_exceptions",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  settings: ["id", "payload", "updated_at"],
};

/** Columns never overwritten by an update — set only when the row is first inserted. */
const IMMUTABLE_ON_UPDATE: Record<SyncTable, readonly string[]> = {
  tasks: ["id", "created_at"],
  recurring_tasks: ["id", "created_at"],
  settings: ["id"],
};

export type WireRowFor<T extends SyncTable> = T extends "tasks"
  ? TaskWireRow
  : T extends "recurring_tasks"
    ? RecurringTaskWireRow
    : SettingsWireRow;

function rowToWire<T extends SyncTable>(row: Record<string, SqliteValue>): WireRowFor<T> {
  return row as unknown as WireRowFor<T>;
}

/** Reads up to `limit` locally-dirty rows for a table, tombstones included. */
export async function findDirty<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  limit: number
): Promise<WireRowFor<T>[]> {
  const columns = TABLE_COLUMNS[table].join(", ");
  const rows = await executor.run(
    `SELECT ${columns} FROM ${table} WHERE _dirty = 1 LIMIT ?`,
    [limit]
  );
  return rows.map((row) => rowToWire<T>(row));
}

/** Clears `_dirty` on the given ids after a successful push. */
export async function clearDirty(
  executor: SqliteExecutor,
  table: SyncTable,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  await executor.run(`UPDATE ${table} SET _dirty = 0 WHERE id IN (${placeholders})`, ids);
}

/**
 * Upserts a row received from the server (a pull, or a rejected push's
 * winning server_row) with `_dirty` forced to 0 — this is data that already
 * matches the server, so it must not be re-queued for push. Guarded by the
 * same last-write-wins predicate the server itself applies, so an in-flight
 * pull can never clobber a newer local edit made since the pull started.
 */
export async function applyRemoteRow<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  row: WireRowFor<T>
): Promise<void> {
  const columns = TABLE_COLUMNS[table];
  const immutable = new Set(IMMUTABLE_ON_UPDATE[table]);
  const updateSet = columns
    .filter((c) => !immutable.has(c))
    .map((c) => `${c} = excluded.${c}`)
    .concat("_dirty = 0")
    .join(", ");

  const sql = `
    INSERT INTO ${table} (${columns.join(", ")}, _dirty)
    VALUES (${columns.map(() => "?").join(", ")}, 0)
    ON CONFLICT(id) DO UPDATE SET ${updateSet}
    WHERE excluded.updated_at >= ${table}.updated_at
  `;
  const params = columns.map((c) => (row as unknown as Record<string, SqliteValue>)[c] ?? null);
  await executor.run(sql, params);
}
