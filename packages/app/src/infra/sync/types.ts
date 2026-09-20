/**
 * Wire shapes for /sync/push and /sync/pull — snake_case, 1:1 with
 * packages/api/src/lib/sync-types.ts, which must be kept in sync with this
 * file. Deliberately raw/snake_case rather than the app's domain types
 * (Task, RecurringTask, GeneralSettings) — the sync engine moves rows
 * straight between sqlite columns and these wire shapes without going
 * through domain mapping, since it operates beneath the repository layer
 * (see modules/sync/dirty-rows.ts).
 */

export interface TaskWireRow {
  id: string;
  name: string;
  description: string | null;
  status: number;
  at_time: string | null;
  at_epoch_millis: number | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  recurring_type: string | null;
  recurring_interval: number | null;
  recurring_task_id: string | null;
  hijri_date_offset: number | null;
  duration_minutes: number;
  /** Full current membership snapshot — the owning row's `task_tags`. */
  tag_ids: string[];
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  deleted_at: number | null;
}

export interface RecurringTaskWireRow {
  id: string;
  name: string;
  description: string | null;
  recurring_type: string;
  recurring_interval: number;
  base_date_epoch: number;
  at_time: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  hijri_date_offset: number | null;
  duration_minutes: number;
  /** Full current membership snapshot — the owning row's `recurring_task_tags`. */
  tag_ids: string[];
  recurring_end: string | null;
  recurring_end_epoch: number | null;
  recurring_end_occurrences: number | null;
  use_gregorian: number;
  occurrence_exceptions: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

/** Key/value settings row — see infra/settings/SqliteSettingsRepository.ts. */
export interface SettingsWireRow {
  key: string;
  value: string;
  updated_at: number;
}

export interface TagWireRow {
  id: string;
  name: string;
  color: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export type WireRow = TaskWireRow | RecurringTaskWireRow | SettingsWireRow | TagWireRow;

export interface SyncPushRequest {
  tasks: TaskWireRow[];
  recurring_tasks: RecurringTaskWireRow[];
  settings: SettingsWireRow[];
  tags: TagWireRow[];
}

/**
 * A rejected push row is either the full winning server row (a
 * last-write-wins loss, safe to apply locally) or a lightweight
 * `{id, reason}` marker (e.g. `INVALID_REFERENCE` when a task's
 * `recurring_task_id` doesn't exist server-side yet) that carries no row
 * data to apply. `id` identifies the row's primary key value regardless of
 * what that column is called on the table (settings' key column included).
 */
export type RejectedServerRow<T extends WireRow> =
  | (T & { rev: number })
  | { id: string; reason: string };

export interface SyncPushTableResult<T extends WireRow> {
  applied: string[];
  rejected: { id: string; server_row: RejectedServerRow<T> }[];
}

export interface SyncPushResponse {
  tasks: SyncPushTableResult<TaskWireRow>;
  recurring_tasks: SyncPushTableResult<RecurringTaskWireRow>;
  settings: SyncPushTableResult<SettingsWireRow>;
  tags: SyncPushTableResult<TagWireRow>;
}

export interface SyncPullTableResult<T extends WireRow> {
  rows: (T & { rev: number })[];
  next_cursor: number;
  has_more: boolean;
}

export interface SyncPullResponse {
  tasks: SyncPullTableResult<TaskWireRow>;
  recurring_tasks: SyncPullTableResult<RecurringTaskWireRow>;
  settings: SyncPullTableResult<SettingsWireRow>;
  tags: SyncPullTableResult<TagWireRow>;
}

export interface SyncPullCursors {
  tasks: number;
  recurring_tasks: number;
  settings: number;
  tags: number;
}
