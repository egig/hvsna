// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";
import type { SettingsWireRow, TaskWireRow } from "@/infra/sync/types";
import { applyRemoteRow, clearDirty, findDirty } from "../dirty-rows";

async function insertRawTask(
  client: SqliteExecutor,
  overrides: Partial<Record<string, SqliteValue>> = {}
) {
  const row: Record<string, SqliteValue> = {
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
    tags: null,
    created_at: 1000,
    updated_at: 1000,
    completed_at: null,
    deleted_at: null,
    _dirty: 1,
    ...overrides,
  };
  const cols = Object.keys(row);
  await client.run(
    `INSERT INTO tasks (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    cols.map((c) => row[c])
  );
}

const baseTaskRow: TaskWireRow = {
  id: "task_1",
  name: "Remote task",
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
  tags: null,
  created_at: 1000,
  updated_at: 1000,
  completed_at: null,
  deleted_at: null,
};

describe("dirty-rows", () => {
  it("findDirty returns only _dirty rows, clearDirty clears them", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, { id: "task_1", _dirty: 1 });
    await insertRawTask(client, { id: "task_2", _dirty: 0 });

    const dirty = await findDirty(client, "tasks", 10);
    expect(dirty.map((r) => r.id)).toEqual(["task_1"]);

    await clearDirty(client, "tasks", ["task_1"]);
    expect(await findDirty(client, "tasks", 10)).toEqual([]);
  });

  it("applyRemoteRow inserts a new row with _dirty forced to 0", async () => {
    const client = await createTestSqliteClient();

    await applyRemoteRow(client, "tasks", baseTaskRow);

    const [stored] = await client.run(`SELECT name, _dirty FROM tasks WHERE id = ?`, ["task_1"]);
    expect(stored.name).toBe("Remote task");
    expect(stored._dirty).toBe(0);
  });

  it("overwrites the local row when the remote copy is newer, without touching created_at", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, { name: "Local edit", created_at: 1, updated_at: 1000 });

    await applyRemoteRow(client, "tasks", { ...baseTaskRow, name: "Remote wins", updated_at: 2000 });

    const [stored] = await client.run(
      `SELECT name, created_at, _dirty FROM tasks WHERE id = ?`,
      ["task_1"]
    );
    expect(stored.name).toBe("Remote wins");
    expect(stored.created_at).toBe(1);
    expect(stored._dirty).toBe(0);
  });

  it("never clobbers a newer, still-dirty local edit with a stale remote row", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, { name: "Newer local edit", updated_at: 5000, _dirty: 1 });

    await applyRemoteRow(client, "tasks", { ...baseTaskRow, name: "Stale remote", updated_at: 1000 });

    const [stored] = await client.run(`SELECT name, _dirty FROM tasks WHERE id = ?`, ["task_1"]);
    expect(stored.name).toBe("Newer local edit");
    expect(stored._dirty).toBe(1);
  });

  it("works for the single-row settings table too", async () => {
    const client = await createTestSqliteClient();
    await client.run(
      `INSERT INTO settings (id, payload, updated_at, _dirty) VALUES ('settings', '{}', 1000, 1)`
    );

    expect(await findDirty(client, "settings", 10)).toHaveLength(1);

    const remoteRow: SettingsWireRow = {
      id: "settings",
      payload: '{"language":"id"}',
      updated_at: 2000,
    };
    await applyRemoteRow(client, "settings", remoteRow);

    const [stored] = await client.run(`SELECT payload, _dirty FROM settings WHERE id = ?`, [
      "settings",
    ]);
    expect(stored.payload).toBe('{"language":"id"}');
    expect(stored._dirty).toBe(0);
  });
});
