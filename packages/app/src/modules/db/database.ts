import Dexie, { type Table } from "dexie";
import type {
  RecurringTaskWireRow,
  SettingsWireRow,
  TagWireRow,
  TaskWireRow,
} from "@/infra/sync/types";

/** 1 = has local changes /sync/push hasn't acknowledged yet. A number rather
 * than a boolean because IndexedDB can't index booleans. */
export type DirtyFlag = 0 | 1;

/**
 * Stored rows keep the snake_case sync wire shape (minus `tag_ids`, which
 * lives in the join tables) so the sync engine moves rows between IndexedDB
 * and /sync/* without a mapping layer — see modules/sync/dirty-rows.ts.
 * Absent values are stored as `null`, never `undefined`, matching the wire.
 */
export type TaskRow = Omit<TaskWireRow, "tag_ids"> & { _dirty: DirtyFlag };
export type RecurringTaskRow = Omit<RecurringTaskWireRow, "tag_ids"> & { _dirty: DirtyFlag };
export type SettingsRow = SettingsWireRow & { _dirty: DirtyFlag };
export type TagRow = TagWireRow & { _dirty: DirtyFlag };
export interface TaskTagRow {
  task_id: string;
  tag_id: string;
}
export interface RecurringTaskTagRow {
  recurring_task_id: string;
  tag_id: string;
}
/** Local-only sync bookkeeping (pull cursors, last success time); never synced. */
export interface SyncStateRow {
  key: string;
  value: string;
}

export const DATABASE_NAME = "hvsna";

/**
 * The web app's local database: IndexedDB via Dexie. Indexes only cover
 * non-null lookups — IndexedDB leaves rows whose indexed value is null out of
 * the index, so "IS NULL" conditions (`deleted_at`, unscheduled tasks) are
 * filtered in JS instead.
 *
 * Schema changes add a new `this.version(n)` block (with an `upgrade()` when
 * existing rows need rewriting) and never edit an already-shipped one.
 */
export class HvsnaDatabase extends Dexie {
  tasks!: Table<TaskRow, string>;
  recurring_tasks!: Table<RecurringTaskRow, string>;
  settings!: Table<SettingsRow, string>;
  tags!: Table<TagRow, string>;
  task_tags!: Table<TaskTagRow, [string, string]>;
  recurring_task_tags!: Table<RecurringTaskTagRow, [string, string]>;
  _sync_state!: Table<SyncStateRow, string>;

  constructor(name: string = DATABASE_NAME) {
    super(name);
    this.version(1).stores({
      tasks: "id, status, at_epoch_millis, completed_at, recurring_task_id, _dirty",
      recurring_tasks: "id, _dirty",
      settings: "key, _dirty",
      tags: "id, name, _dirty",
      task_tags: "[task_id+tag_id], task_id, tag_id",
      recurring_task_tags: "[recurring_task_id+tag_id], recurring_task_id, tag_id",
      _sync_state: "key",
    });
  }
}
