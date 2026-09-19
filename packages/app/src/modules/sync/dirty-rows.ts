import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";
import type {
  RecurringTaskWireRow,
  SettingsWireRow,
  TagWireRow,
  TaskWireRow,
} from "@/infra/sync/types";

export type SyncTable = "tasks" | "recurring_tasks" | "settings" | "tags";

/**
 * Column lists mirror the sqlite schema exactly (see
 * modules/sqlite/migrations/user/0000_rainy_brother_voodoo.sql and
 * 0001_normalize_tags_and_settings.sql) — wire rows are snake_case with the
 * same field names as these columns, so no mapping layer is needed between
 * a dirty-row scan and a push request body, or between a pulled row and a
 * local upsert. `tasks`/`recurring_tasks` no longer carry a `tags` column —
 * their tag membership lives in `task_tags`/`recurring_task_tags` and is
 * attached separately (see TAG_ASSOCIATIONS below).
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
    "recurring_end",
    "recurring_end_epoch",
    "recurring_end_occurrences",
    "use_gregorian",
    "occurrence_exceptions",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  settings: ["key", "value", "updated_at"],
  tags: ["id", "name", "color", "created_at", "updated_at", "deleted_at"],
};

/** Columns never overwritten by an update — set only when the row is first inserted. */
const IMMUTABLE_ON_UPDATE: Record<SyncTable, readonly string[]> = {
  tasks: ["id", "created_at"],
  recurring_tasks: ["id", "created_at"],
  settings: ["key"],
  tags: ["id", "created_at"],
};

/** The column identifying a row, keyed per table — `settings` uses `key`, everything else `id`. */
const PRIMARY_KEY: Record<SyncTable, string> = {
  tasks: "id",
  recurring_tasks: "id",
  settings: "key",
  tags: "id",
};

/**
 * Tables whose rows carry a full tag-membership snapshot on the wire
 * (`tag_ids`), backed by a join table that itself has no `_dirty`/
 * `updated_at` of its own — membership rides along with the owning row's
 * own push/pull instead of being synced independently (see
 * infra/tag/SqliteTagRepository.ts: every write to task_tags/
 * recurring_task_tags happens alongside a write to the owning task/
 * recurring_task row, which is what actually gets marked dirty).
 */
const TAG_ASSOCIATIONS: Partial<Record<SyncTable, { joinTable: string; column: string }>> = {
  tasks: { joinTable: "task_tags", column: "task_id" },
  recurring_tasks: { joinTable: "recurring_task_tags", column: "recurring_task_id" },
};

export type WireRowFor<T extends SyncTable> = T extends "tasks"
  ? TaskWireRow
  : T extends "recurring_tasks"
    ? RecurringTaskWireRow
    : T extends "settings"
      ? SettingsWireRow
      : TagWireRow;

function rowToWire<T extends SyncTable>(row: Record<string, SqliteValue>): WireRowFor<T> {
  return row as unknown as WireRowFor<T>;
}

function parseTagIds(value: SqliteValue | undefined): string[] {
  if (value === undefined || value === null) return [];
  return JSON.parse(String(value)) as string[];
}

/** Reads up to `limit` locally-dirty rows for a table, tombstones included. */
export async function findDirty<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  limit: number
): Promise<WireRowFor<T>[]> {
  const columns = TABLE_COLUMNS[table].join(", ");
  const assoc = TAG_ASSOCIATIONS[table];
  const tagSelect = assoc
    ? `, (SELECT COALESCE(json_group_array(tag_id), '[]') FROM ${assoc.joinTable} WHERE ${assoc.column} = ${table}.id) AS tag_ids`
    : "";
  const rows = await executor.run(
    `SELECT ${columns}${tagSelect} FROM ${table} WHERE _dirty = 1 LIMIT ?`,
    [limit]
  );
  return rows.map((row) =>
    rowToWire<T>(assoc ? { ...row, tag_ids: parseTagIds(row.tag_ids) as unknown as SqliteValue } : row)
  );
}

/** Acknowledge only the exact snapshot sent. Timestamps alone cannot detect
 * two edits in the same millisecond; tag membership belongs to the snapshot too. */
export async function clearDirty<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  uploaded: WireRowFor<T>[]
): Promise<void> {
  const columns = TABLE_COLUMNS[table];
  const assoc = TAG_ASSOCIATIONS[table];
  for (const row of uploaded) {
    const values = row as unknown as Record<string, SqliteValue>;
    const conditions = columns.map((column) => `${column} IS ?`);
    const params = columns.map((column) => values[column] ?? null);
    if (assoc) {
      const ids = (row as unknown as { tag_ids: string[] }).tag_ids;
      conditions.push(`(SELECT COUNT(*) FROM ${assoc.joinTable} WHERE ${assoc.column} = ${table}.id) = ?`);
      conditions.push(`NOT EXISTS (SELECT 1 FROM ${assoc.joinTable} WHERE ${assoc.column} = ${table}.id AND tag_id NOT IN (SELECT value FROM json_each(?)))`);
      params.push(ids.length, JSON.stringify(ids));
    }
    await executor.run(`UPDATE ${table} SET _dirty = 0 WHERE ${conditions.join(" AND ")}`, params);
  }
}

async function replaceTagAssociations(
  executor: SqliteExecutor,
  assoc: { joinTable: string; column: string },
  entityId: string,
  tagIds: string[]
): Promise<void> {
  await executor.run(`DELETE FROM ${assoc.joinTable} WHERE ${assoc.column} = ?`, [entityId]);
  for (const tagId of tagIds) {
    await executor.run(
      `INSERT OR IGNORE INTO ${assoc.joinTable} (${assoc.column}, tag_id) VALUES (?, ?)`,
      [entityId, tagId]
    );
  }
}

/**
 * Upserts a row received from the server (a pull, or a rejected push's
 * winning server_row) with `_dirty` forced to 0 — this is data that already
 * matches the server, so it must not be re-queued for push. Guarded by the
 * last-write-wins predicate, preserving dirty local edits on timestamp ties
 * as well (two local edits may share a millisecond). An in-flight pull must
 * not clobber edits that remain queued after snapshot acknowledgement —
 * `RETURNING` tells us whether the guard actually let the write through, so
 * tag membership (for tasks/recurring_tasks) is only replaced when it did.
 */
export async function applyRemoteRow<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  row: WireRowFor<T>
): Promise<void> {
  return executor.transaction((client) => applyRemoteRowInTransaction(client, table, row));
}

async function applyRemoteRowInTransaction<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  row: WireRowFor<T>,
): Promise<void> {
  const columns = TABLE_COLUMNS[table];
  const pk = PRIMARY_KEY[table];
  const immutable = new Set(IMMUTABLE_ON_UPDATE[table]);
  const updateSet = columns
    .filter((c) => !immutable.has(c))
    .map((c) => `${c} = excluded.${c}`)
    .concat("_dirty = 0")
    .join(", ");

  const sql = `
    INSERT INTO ${table} (${columns.join(", ")}, _dirty)
    VALUES (${columns.map(() => "?").join(", ")}, 0)
    ON CONFLICT(${pk}) DO UPDATE SET ${updateSet}
    WHERE excluded.updated_at > ${table}.updated_at
       OR (excluded.updated_at = ${table}.updated_at AND ${table}._dirty = 0)
    RETURNING ${pk}
  `;
  const params = columns.map((c) => (row as unknown as Record<string, SqliteValue>)[c] ?? null);
  const result = await executor.run(sql, params);

  const assoc = TAG_ASSOCIATIONS[table];
  if (assoc && result.length > 0) {
    const entityId = String(result[0][pk]);
    const tagIds = (row as unknown as { tag_ids?: string[] }).tag_ids ?? [];
    await replaceTagAssociations(executor, assoc, entityId, tagIds);
  }
}
