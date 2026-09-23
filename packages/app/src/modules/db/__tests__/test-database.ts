import { HvsnaDatabase, type TagRow, type TaskRow } from "../database";
import { createDbExecutor, type DbExecutor } from "../executor";

let counter = 0;

/**
 * A fresh, real Dexie database for each test — same schema and code path
 * as production, backed by fake-indexeddb's in-memory IndexedDB instead of
 * the browser's. The unique name keeps tests from sharing data.
 */
export function createTestDatabase(): DbExecutor {
  return createDbExecutor(new HvsnaDatabase(`hvsna-test-${++counter}`));
}

export function taskRow(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "task_1",
    name: "Buy milk",
    description: null,
    status: 0,
    at_time: null,
    at_epoch_millis: null,
    lat: null,
    lng: null,
    timezone: null,
    recurring_type: null,
    recurring_interval: null,
    recurring_task_id: null,
    hijri_date_offset: null,
    created_at: 1000,
    updated_at: 1000,
    completed_at: null,
    deleted_at: null,
    _dirty: 1,
    ...overrides,
  };
}

export function tagRow(overrides: Partial<TagRow> = {}): TagRow {
  return {
    id: "tag_1",
    name: "urgent",
    color: "#64748B",
    created_at: 1000,
    updated_at: 1000,
    deleted_at: null,
    _dirty: 0,
    ...overrides,
  };
}
