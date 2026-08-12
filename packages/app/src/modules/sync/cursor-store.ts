import type { SqliteExecutor } from "@/modules/sqlite/client";
import type { SyncTable } from "./dirty-rows";

const CURSOR_KEY: Record<SyncTable, string> = {
  tasks: "sync_cursor_tasks",
  recurring_tasks: "sync_cursor_recurring_tasks",
  settings: "sync_cursor_settings",
};

const LAST_SUCCESS_KEY = "sync_last_success_at";

async function getValue(executor: SqliteExecutor, key: string): Promise<string | null> {
  const rows = await executor.run(`SELECT value FROM _sync_state WHERE key = ?`, [key]);
  return rows[0] ? String(rows[0].value) : null;
}

async function setValue(executor: SqliteExecutor, key: string, value: string): Promise<void> {
  await executor.run(
    `INSERT INTO _sync_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/** The last server `rev` this device has pulled for `table`; 0 means never pulled. */
export async function getCursor(executor: SqliteExecutor, table: SyncTable): Promise<number> {
  const value = await getValue(executor, CURSOR_KEY[table]);
  return value !== null ? Number(value) : 0;
}

export async function setCursor(
  executor: SqliteExecutor,
  table: SyncTable,
  rev: number
): Promise<void> {
  await setValue(executor, CURSOR_KEY[table], String(rev));
}

export async function getLastSuccessAt(executor: SqliteExecutor): Promise<Date | null> {
  const value = await getValue(executor, LAST_SUCCESS_KEY);
  return value !== null ? new Date(Number(value)) : null;
}

export async function setLastSuccessAt(executor: SqliteExecutor, at: number): Promise<void> {
  await setValue(executor, LAST_SUCCESS_KEY, String(at));
}
