import type { DbExecutor } from "@/modules/db/executor";
import type { HvsnaDatabase } from "@/modules/db/database";
import type {
  RecurringTaskWireRow,
  SettingsWireRow,
  TagWireRow,
  TaskWireRow,
} from "@/infra/sync/types";

export type SyncTable = "tasks" | "recurring_tasks" | "settings" | "tags";

/**
 * Field lists mirror the stored row shapes exactly (see
 * modules/db/database.ts) — wire rows are snake_case with the same field
 * names, so no mapping layer is needed between a dirty-row scan and a push
 * request body, or between a pulled row and a local upsert. Stored
 * `tasks`/`recurring_tasks` rows carry no `tags` — their tag membership
 * lives in `task_tags`/`recurring_task_tags` and is attached separately
 * (see TAG_ASSOCIATIONS below).
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
 * infra/tag/DexieTagRepository.ts: every write to task_tags/
 * recurring_task_tags happens alongside a write to the owning task/
 * recurring_task row, which is what actually gets marked dirty).
 */
const TAG_ASSOCIATIONS: Partial<
  Record<SyncTable, { joinTable: "task_tags" | "recurring_task_tags"; column: string }>
> = {
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

type StoredRow = Record<string, unknown> & { _dirty: 0 | 1 };

// Dexie's per-table typings don't survive indexing by a SyncTable union, so
// the helpers below work on untyped rows; TABLE_COLUMNS keeps them honest.
function table(db: HvsnaDatabase, name: SyncTable) {
  return db.table<StoredRow, string>(name);
}

function joinTable(db: HvsnaDatabase, name: "task_tags" | "recurring_task_tags") {
  return db.table<Record<string, string>, [string, string]>(name);
}

/** Copies exactly the table's wire fields, with absent values as null. */
function pickColumns(tableName: SyncTable, row: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const column of TABLE_COLUMNS[tableName]) picked[column] = row[column] ?? null;
  return picked;
}

async function tagIdsFor(
  db: HvsnaDatabase,
  assoc: { joinTable: "task_tags" | "recurring_task_tags"; column: string },
  entityIds: string[]
): Promise<Map<string, string[]>> {
  const links = await joinTable(db, assoc.joinTable).where(assoc.column).anyOf(entityIds).toArray();
  const result = new Map<string, string[]>();
  for (const link of links) {
    const list = result.get(link[assoc.column]) ?? [];
    list.push(link.tag_id);
    result.set(link[assoc.column], list);
  }
  return result;
}

/** Reads up to `limit` locally-dirty rows for a table, tombstones included. */
export async function findDirty<T extends SyncTable>(
  executor: DbExecutor,
  tableName: T,
  limit: number
): Promise<WireRowFor<T>[]> {
  const { db } = executor;
  return executor.transaction(async () => {
    const rows = await table(db, tableName).where("_dirty").equals(1).limit(limit).toArray();
    const assoc = TAG_ASSOCIATIONS[tableName];
    const pk = PRIMARY_KEY[tableName];
    const tagIds = assoc
      ? await tagIdsFor(db, assoc, rows.map((row) => String(row[pk])))
      : null;
    return rows.map((row) => {
      const wire = pickColumns(tableName, row);
      if (tagIds) wire.tag_ids = tagIds.get(String(row[pk])) ?? [];
      return wire as unknown as WireRowFor<T>;
    });
  });
}

function sameMembers(current: string[], uploaded: string[]): boolean {
  const uploadedSet = new Set(uploaded);
  return current.length === uploaded.length && current.every((id) => uploadedSet.has(id));
}

/** Acknowledge only the exact snapshot sent. Timestamps alone cannot detect
 * two edits in the same millisecond; tag membership belongs to the snapshot too. */
export async function clearDirty<T extends SyncTable>(
  executor: DbExecutor,
  tableName: T,
  uploaded: WireRowFor<T>[]
): Promise<void> {
  const { db } = executor;
  const columns = TABLE_COLUMNS[tableName];
  const assoc = TAG_ASSOCIATIONS[tableName];
  const pk = PRIMARY_KEY[tableName];
  await executor.transaction(async () => {
    for (const sent of uploaded) {
      const values = sent as unknown as Record<string, unknown>;
      const id = String(values[pk]);
      const current = await table(db, tableName).get(id);
      if (!current) continue;
      if (!columns.every((column) => (current[column] ?? null) === (values[column] ?? null))) {
        continue;
      }
      if (assoc) {
        const currentTagIds = (await tagIdsFor(db, assoc, [id])).get(id) ?? [];
        if (!sameMembers(currentTagIds, values.tag_ids as string[])) continue;
      }
      await table(db, tableName).update(id, { _dirty: 0 });
    }
  });
}

/**
 * Upserts a row received from the server (a pull, or a rejected push's
 * winning server_row) with `_dirty` forced to 0 — this is data that already
 * matches the server, so it must not be re-queued for push. Guarded by the
 * last-write-wins predicate, preserving dirty local edits on timestamp ties
 * as well (two local edits may share a millisecond). An in-flight pull must
 * not clobber edits that remain queued after snapshot acknowledgement, and
 * tag membership (for tasks/recurring_tasks) is only replaced when the
 * guard let the row through.
 */
export async function applyRemoteRow<T extends SyncTable>(
  executor: DbExecutor,
  tableName: T,
  row: WireRowFor<T>
): Promise<void> {
  const { db } = executor;
  const values = row as unknown as Record<string, unknown>;
  const pk = PRIMARY_KEY[tableName];
  const id = String(values[pk]);
  const remote = pickColumns(tableName, values);

  await executor.transaction(async () => {
    const existing = await table(db, tableName).get(id);
    if (existing) {
      const remoteUpdatedAt = Number(remote.updated_at);
      const localUpdatedAt = Number(existing.updated_at);
      const wins =
        remoteUpdatedAt > localUpdatedAt ||
        (remoteUpdatedAt === localUpdatedAt && existing._dirty === 0);
      if (!wins) return;
      for (const column of IMMUTABLE_ON_UPDATE[tableName]) remote[column] = existing[column];
    }
    await table(db, tableName).put({ ...remote, _dirty: 0 });

    const assoc = TAG_ASSOCIATIONS[tableName];
    if (assoc) {
      const links = joinTable(db, assoc.joinTable);
      await links.where(assoc.column).equals(id).delete();
      const tagIds = [...new Set((values.tag_ids as string[] | undefined) ?? [])];
      await links.bulkPut(tagIds.map((tagId) => ({ [assoc.column]: id, tag_id: tagId })));
    }
  });
}
