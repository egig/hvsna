import type { DbExecutor } from "./executor";
import type { DirtyFlag } from "./database";
import {
  OPFS_DIRECTORY,
  type LegacyDump,
  type LegacyRow,
  type LegacyWorkerMessage,
} from "./legacy-sqlite/protocol";

/** Set in `_sync_state` in the same transaction as the imported rows. */
export const LEGACY_IMPORTED_KEY = "legacy_sqlite_imported_at";

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (await navigator.storage?.getDirectory?.()) ?? null;
  } catch {
    return null;
  }
}

async function hasLegacySqliteData(): Promise<boolean> {
  const root = await getOpfsRoot();
  if (!root) return false;
  try {
    await root.getDirectoryHandle(OPFS_DIRECTORY);
    return true;
  } catch {
    return false;
  }
}

/** Deletes the pre-IndexedDB SQLite database from OPFS, if there is one. */
export async function removeLegacySqliteData(): Promise<void> {
  const root = await getOpfsRoot();
  if (!root) return;
  try {
    await root.removeEntry(OPFS_DIRECTORY, { recursive: true });
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return;
    throw error;
  }
}

function dirty(row: LegacyRow): DirtyFlag {
  return Number(row._dirty) ? 1 : 0;
}

function str(value: LegacyRow[string] | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function num(value: LegacyRow[string] | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Copies a legacy SQLite dump into IndexedDB in one transaction, keeping each
 * row's `_dirty` flag so edits not yet pushed still sync afterwards. Also
 * records `LEGACY_IMPORTED_KEY`, so a failure to delete the old OPFS files
 * afterwards can't cause a second import over newer data.
 */
export async function writeLegacyDump(executor: DbExecutor, dump: LegacyDump): Promise<void> {
  const { db } = executor;
  await executor.transaction(async () => {
    await db.tasks.bulkPut(
      dump.tasks.map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        description: str(row.description),
        status: Number(row.status ?? 0),
        at_time: str(row.at_time),
        at_epoch_millis: num(row.at_epoch_millis),
        lat: num(row.lat),
        lng: num(row.lng),
        timezone: str(row.timezone),
        recurring_type: str(row.recurring_type),
        recurring_interval: num(row.recurring_interval),
        recurring_task_id: str(row.recurring_task_id),
        hijri_date_offset: num(row.hijri_date_offset),
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
        completed_at: num(row.completed_at),
        deleted_at: num(row.deleted_at),
        _dirty: dirty(row),
      }))
    );
    await db.recurring_tasks.bulkPut(
      dump.recurring_tasks.map((row) => ({
        id: String(row.id),
        name: String(row.name ?? ""),
        description: str(row.description),
        recurring_type: String(row.recurring_type),
        recurring_interval: Number(row.recurring_interval ?? 1),
        base_date_epoch: Number(row.base_date_epoch ?? 0),
        at_time: str(row.at_time),
        lat: num(row.lat),
        lng: num(row.lng),
        timezone: str(row.timezone),
        hijri_date_offset: num(row.hijri_date_offset),
        recurring_end: str(row.recurring_end),
        recurring_end_epoch: num(row.recurring_end_epoch),
        recurring_end_occurrences: num(row.recurring_end_occurrences),
        use_gregorian: Number(row.use_gregorian ?? 0),
        occurrence_exceptions: str(row.occurrence_exceptions),
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
        deleted_at: num(row.deleted_at),
        _dirty: dirty(row),
      }))
    );
    await db.settings.bulkPut(
      dump.settings.map((row) => ({
        key: String(row.key),
        value: String(row.value),
        updated_at: Number(row.updated_at),
        _dirty: dirty(row),
      }))
    );
    await db.tags.bulkPut(
      dump.tags.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        color: String(row.color),
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
        deleted_at: num(row.deleted_at),
        _dirty: dirty(row),
      }))
    );
    await db.task_tags.bulkPut(
      dump.task_tags.map((row) => ({ task_id: String(row.task_id), tag_id: String(row.tag_id) }))
    );
    await db.recurring_task_tags.bulkPut(
      dump.recurring_task_tags.map((row) => ({
        recurring_task_id: String(row.recurring_task_id),
        tag_id: String(row.tag_id),
      }))
    );
    await db._sync_state.bulkPut(
      dump._sync_state.map((row) => ({ key: String(row.key), value: String(row.value) }))
    );
    await db._sync_state.put({ key: LEGACY_IMPORTED_KEY, value: String(Date.now()) });
  });
}

function readLegacyDump(
  worker: Worker,
  onLockStateChange: (state: "locked" | "ready") => void
): Promise<LegacyDump> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<LegacyWorkerMessage>) => {
      const message = event.data;
      if (message.kind === "status") onLockStateChange(message.state);
      else if (message.kind === "dump") resolve(message.dump);
      else reject(new Error(message.error));
    };
    worker.onerror = (event) => reject(new Error(event.message || "Legacy SQLite worker failed"));
  });
}

/**
 * One-time move from the SQLite/OPFS database older builds used (wa-sqlite in
 * a Worker) into IndexedDB. A no-op, without loading wa-sqlite, once the OPFS
 * directory is gone. Runs before the first render; if another tab of an
 * older build still has the database open, it waits for that tab to close
 * and reports "locked" meanwhile so the boot screen can say so.
 */
export async function importLegacySqlite(
  executor: DbExecutor,
  onLockStateChange: (state: "locked" | "ready") => void = () => {}
): Promise<void> {
  if (!(await hasLegacySqliteData())) return;

  if (!(await executor.db._sync_state.get(LEGACY_IMPORTED_KEY))) {
    const worker = new Worker(new URL("./legacy-sqlite/worker.ts", import.meta.url), {
      type: "module",
    });
    try {
      await writeLegacyDump(executor, await readLegacyDump(worker, onLockStateChange));
      // Removed while the worker still holds the old build's Web Lock, so an
      // old-version tab can't reopen the database mid-delete.
      await removeLegacySqliteData();
    } finally {
      worker.terminate();
    }
    return;
  }
  await removeLegacySqliteData();
}
