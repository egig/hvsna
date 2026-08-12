// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "./test-sqlite-client";

describe("createTestSqliteClient", () => {
  it("bootstraps the schema and can run parameterized queries", async () => {
    const client = await createTestSqliteClient();

    await client.run(
      `INSERT INTO tasks (id, name, status, created_at, updated_at) VALUES (?, ?, 0, ?, ?)`,
      ["task_1", "Buy milk", 1000, 1000]
    );

    const rows = await client.run(`SELECT id, name, status FROM tasks WHERE id = ?`, [
      "task_1",
    ]);

    expect(rows).toEqual([{ id: "task_1", name: "Buy milk", status: 0 }]);
  });

  it("has the client-only _dirty column and _sync_state table", async () => {
    const client = await createTestSqliteClient();

    const taskRows = await client.run(
      `SELECT _dirty FROM tasks WHERE id = 'nonexistent'`
    );
    expect(taskRows).toEqual([]);

    await client.run(`INSERT INTO _sync_state (key, value) VALUES ('lastPulledSeq', '5')`);
    const stateRows = await client.run(`SELECT value FROM _sync_state WHERE key = 'lastPulledSeq'`);
    expect(stateRows).toEqual([{ value: "5" }]);
  });
});
