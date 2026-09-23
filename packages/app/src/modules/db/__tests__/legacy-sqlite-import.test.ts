// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "wa-sqlite";
import { MemoryVFS } from "wa-sqlite/src/examples/MemoryVFS.js";
import { applyMigrations } from "../legacy-sqlite/migration-runner";
import { runQuery } from "../legacy-sqlite/sql-runner";
import { LEGACY_TABLES, type LegacyDump } from "../legacy-sqlite/protocol";
import { importLegacySqlite, LEGACY_IMPORTED_KEY, writeLegacyDump } from "../legacy-sqlite-import";
import { createTestDatabase } from "./test-database";
import { createWebRepositories } from "@/modules/repositories-context";
import { findDirty } from "@/modules/sync/dirty-rows";

// wa-sqlite's Emscripten loader fetches its .wasm via a file:// URL outside a
// bundler, which Node's fetch doesn't support — serve those from disk.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : String(input);
  if (!url.startsWith("file://")) return realFetch(input, init);
  return new Response(readFileSync(fileURLToPath(url)), {
    headers: { "Content-Type": "application/wasm" },
  });
}) as typeof fetch;

/** Builds a legacy SQLite database in memory and dumps it the way the
 * legacy worker does. */
async function legacyDump(statements: string[]): Promise<LegacyDump> {
  const sqlite3 = SQLite.Factory(await SQLiteESMFactory());
  sqlite3.vfs_register(new MemoryVFS() as unknown as SQLiteVFS, true);
  const db = await sqlite3.open_v2("legacy.sqlite3");
  await applyMigrations(sqlite3, db);
  for (const sql of statements) await sqlite3.exec(db, sql);
  const dump = {} as LegacyDump;
  for (const table of LEGACY_TABLES) {
    dump[table] = await runQuery(sqlite3, db, `SELECT * FROM ${table}`);
  }
  await sqlite3.close(db);
  return dump;
}

describe("legacy SQLite import", () => {
  it("copies every table into IndexedDB, keeping dirty flags and tag links", async () => {
    const dump = await legacyDump([
      `INSERT INTO recurring_tasks (id, name, recurring_type, recurring_interval, base_date_epoch,
         use_gregorian, occurrence_exceptions, created_at, updated_at, _dirty)
       VALUES ('rtask_1', 'Daily', 'daily', 1, 1700000000000, 1, '["2026-01-01"]', 1, 2, 0)`,
      `INSERT INTO tasks (id, name, status, at_epoch_millis, recurring_task_id, created_at, updated_at, _dirty)
       VALUES ('task_1', 'Pending', 0, 1700000000000, 'rtask_1', 1, 2, 1),
              ('task_2', 'Synced', 1, NULL, NULL, 1, 2, 0)`,
      `INSERT INTO tags (id, name, color, created_at, updated_at, _dirty)
       VALUES ('tag_1', 'work', '#4B4953', 1, 2, 0)`,
      `INSERT INTO task_tags (task_id, tag_id) VALUES ('task_1', 'tag_1')`,
      `INSERT INTO recurring_task_tags (recurring_task_id, tag_id) VALUES ('rtask_1', 'tag_1')`,
      `INSERT INTO settings (key, value, updated_at, _dirty) VALUES ('language', '"id"', 5, 1)`,
      `INSERT INTO _sync_state (key, value) VALUES ('sync_cursor_tasks', '42')`,
    ]);
    const executor = createTestDatabase();

    await writeLegacyDump(executor, dump);

    const repos = createWebRepositories(executor);
    const pending = await repos.taskRepository.findById("task_1");
    expect(pending).toMatchObject({
      name: "Pending",
      atEpochMillis: 1700000000000,
      recurringTaskId: "rtask_1",
      tags: ["work"],
    });
    expect(await repos.recurringTaskRepository.findById("rtask_1")).toMatchObject({
      useGregorian: true,
      occurrenceExceptions: ["2026-01-01"],
      tags: ["work"],
    });
    expect(await repos.settingsRepository.load()).toEqual({ language: "id" });
    expect((await findDirty(executor, "tasks", 10)).map((row) => row.id)).toEqual(["task_1"]);
    expect(await executor.db._sync_state.get("sync_cursor_tasks")).toEqual({
      key: "sync_cursor_tasks",
      value: "42",
    });
    expect(await executor.db._sync_state.get(LEGACY_IMPORTED_KEY)).toBeDefined();
  });

  it("does nothing when there is no OPFS legacy database", async () => {
    const executor = createTestDatabase();
    await importLegacySqlite(executor);
    expect(await executor.db._sync_state.count()).toBe(0);
  });
});
