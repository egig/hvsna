/**
 * Wire shapes for /sync/push and /sync/pull — snake_case, 1:1 with the
 * columns the client sends/expects (see packages/app/src/infra/sync/types.ts,
 * which must be kept in sync with these).
 */

export interface TaskPushRow {
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
  tags: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  deleted_at: number | null;
}

export interface RecurringTaskPushRow {
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
  tags: string | null;
  recurring_end: string | null;
  recurring_end_epoch: number | null;
  recurring_end_occurrences: number | null;
  use_gregorian: number;
  occurrence_exceptions: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface SettingsPushRow {
  id: string;
  payload: string;
  updated_at: number;
}

export interface SyncPushRequest {
  tasks?: TaskPushRow[];
  recurring_tasks?: RecurringTaskPushRow[];
  settings?: SettingsPushRow[];
}

export interface SyncPushTableResult {
  applied: string[];
  rejected: { id: string; server_row: Record<string, unknown> }[];
}

export interface SyncPushResponse {
  tasks: SyncPushTableResult;
  recurring_tasks: SyncPushTableResult;
  settings: SyncPushTableResult;
}

export interface SyncPullTableResult {
  rows: Record<string, unknown>[];
  next_cursor: number;
  has_more: boolean;
}

export interface SyncPullResponse {
  tasks: SyncPullTableResult;
  recurring_tasks: SyncPullTableResult;
  settings: SyncPullTableResult;
}
