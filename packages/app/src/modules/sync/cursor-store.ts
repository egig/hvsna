import type { DbExecutor } from "@/modules/db/executor";
import type { SyncTable } from "./dirty-rows";

const CURSOR_KEY: Record<SyncTable, string> = {
  tasks: "sync_cursor_tasks",
  recurring_tasks: "sync_cursor_recurring_tasks",
  settings: "sync_cursor_settings",
  tags: "sync_cursor_tags",
};

const LAST_SUCCESS_KEY = "sync_last_success_at";

async function getValue(executor: DbExecutor, key: string): Promise<string | null> {
  const row = await executor.db._sync_state.get(key);
  return row ? row.value : null;
}

async function setValue(executor: DbExecutor, key: string, value: string): Promise<void> {
  await executor.db._sync_state.put({ key, value });
}

/** The last server `rev` this device has pulled for `table`; 0 means never pulled. */
export async function getCursor(executor: DbExecutor, table: SyncTable): Promise<number> {
  const value = await getValue(executor, CURSOR_KEY[table]);
  return value !== null ? Number(value) : 0;
}

export async function setCursor(
  executor: DbExecutor,
  table: SyncTable,
  rev: number
): Promise<void> {
  await setValue(executor, CURSOR_KEY[table], String(rev));
}

export async function getLastSuccessAt(executor: DbExecutor): Promise<Date | null> {
  const value = await getValue(executor, LAST_SUCCESS_KEY);
  return value !== null ? new Date(Number(value)) : null;
}

export async function setLastSuccessAt(executor: DbExecutor, at: number): Promise<void> {
  await setValue(executor, LAST_SUCCESS_KEY, String(at));
}
