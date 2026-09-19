// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import type { SqliteExecutor } from "@/modules/sqlite/client";
import type {
  SyncPullCursors,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  TaskWireRow,
} from "@/infra/sync/types";
import { createSyncEngine, type SyncApiPort } from "../sync-engine";
import { getCursor } from "../cursor-store";

function emptyPushResponse(): SyncPushResponse {
  return {
    tasks: { applied: [], rejected: [] },
    recurring_tasks: { applied: [], rejected: [] },
    settings: { applied: [], rejected: [] },
    tags: { applied: [], rejected: [] },
  };
}

function emptyPullResponse(cursors: SyncPullCursors): SyncPullResponse {
  return {
    tasks: { rows: [], next_cursor: cursors.tasks, has_more: false },
    recurring_tasks: { rows: [], next_cursor: cursors.recurring_tasks, has_more: false },
    settings: { rows: [], next_cursor: cursors.settings, has_more: false },
    tags: { rows: [], next_cursor: cursors.tags, has_more: false },
  };
}

function remoteTaskRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "task_remote",
    name: "From server",
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
    tag_ids: [],
    created_at: 1000,
    updated_at: 1000,
    completed_at: null,
    deleted_at: null,
    rev: 1,
    ...overrides,
  };
}

async function insertRawTask(client: SqliteExecutor, id: string, dirty = 1) {
  await client.run(
    `INSERT INTO tasks (id, name, status, created_at, updated_at, _dirty) VALUES (?, 'Buy milk', 0, 1000, 1000, ?)`,
    [id, dirty]
  );
}

describe("sync-engine", () => {
  it("push() sends dirty rows and clears _dirty on applied ids", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, "task_1");

    const pushCalls: SyncPushRequest[] = [];
    const apiClient: SyncApiPort = {
      push: async (body) => {
        pushCalls.push(body);
        return { ...emptyPushResponse(), tasks: { applied: ["task_1"], rejected: [] } };
      },
      pull: async (cursors) => emptyPullResponse(cursors),
    };

    await createSyncEngine(client, apiClient).push();

    expect(pushCalls).toHaveLength(1);
    expect(pushCalls[0].tasks.map((t) => t.id)).toEqual(["task_1"]);
    const [row] = await client.run(`SELECT _dirty FROM tasks WHERE id = ?`, ["task_1"]);
    expect(row._dirty).toBe(0);
  });

  it("push() applies a rejected row's winning server_row locally", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, "task_1");

    const apiClient: SyncApiPort = {
      push: async () => ({
        ...emptyPushResponse(),
        tasks: {
          applied: [],
          rejected: [
            {
              id: "task_1",
              server_row: remoteTaskRow({ id: "task_1", name: "Server wins", updated_at: 9999 }),
            },
          ],
        },
      }),
      pull: async (cursors) => emptyPullResponse(cursors),
    };

    await createSyncEngine(client, apiClient).push();

    const [row] = await client.run(`SELECT name, _dirty FROM tasks WHERE id = ?`, ["task_1"]);
    expect(row.name).toBe("Server wins");
    expect(row._dirty).toBe(0);
  });

  it("push() does not apply a rejected row that carries only an INVALID_REFERENCE reason", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, "task_1");

    const apiClient: SyncApiPort = {
      push: async () => ({
        ...emptyPushResponse(),
        tasks: {
          applied: [],
          rejected: [{ id: "task_1", server_row: { id: "task_1", reason: "INVALID_REFERENCE" } }],
        },
      }),
      pull: async (cursors) => emptyPullResponse(cursors),
    };

    await createSyncEngine(client, apiClient).push();

    const [row] = await client.run(`SELECT name, _dirty FROM tasks WHERE id = ?`, ["task_1"]);
    expect(row.name).toBe("Buy milk"); // untouched
    expect(row._dirty).toBe(1); // still needs pushing next cycle
  });

  it("pull() applies remote rows and advances the cursor", async () => {
    const client = await createTestSqliteClient();

    const apiClient: SyncApiPort = {
      push: async () => emptyPushResponse(),
      pull: async (cursors) => ({
        ...emptyPullResponse(cursors),
        tasks: { rows: [remoteTaskRow({ rev: 3 })], next_cursor: 3, has_more: false },
      }),
    };

    const applied = await createSyncEngine(client, apiClient).pull();

    expect(applied).toBe(true);
    const [row] = await client.run(`SELECT name FROM tasks WHERE id = ?`, ["task_remote"]);
    expect(row.name).toBe("From server");
    expect(await getCursor(client, "tasks")).toBe(3);
  });

  it("pull() loops while has_more is true and stops once a page is empty", async () => {
    const client = await createTestSqliteClient();
    let call = 0;

    const apiClient: SyncApiPort = {
      push: async () => emptyPushResponse(),
      pull: async (cursors) => {
        call += 1;
        if (call === 1) {
          return {
            ...emptyPullResponse(cursors),
            tasks: {
              rows: [remoteTaskRow({ id: "task_a", rev: 1 })],
              next_cursor: 1,
              has_more: true,
            },
          };
        }
        return emptyPullResponse(cursors);
      },
    };

    await createSyncEngine(client, apiClient).pull();

    expect(call).toBe(2);
    expect(await getCursor(client, "tasks")).toBe(1);
  });

  it("fullSync() pushes before pulling and reports whether anything was pulled", async () => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, "task_1");
    const order: string[] = [];

    const apiClient: SyncApiPort = {
      push: async () => {
        order.push("push");
        return emptyPushResponse();
      },
      pull: async (cursors) => {
        order.push("pull");
        return emptyPullResponse(cursors);
      },
    };

    const applied = await createSyncEngine(client, apiClient).fullSync();

    expect(order).toEqual(["push", "pull"]);
    expect(applied).toBe(false);
  });
});


describe("edits during upload", () => {
  it.each([1000, 2000])("preserves and later uploads a concurrent edit at timestamp %i", async (updatedAt) => {
    const client = await createTestSqliteClient();
    await insertRawTask(client, "task_1");
    const uploads: SyncPushRequest[] = [];
    let serverRow: TaskWireRow & { rev: number } = remoteTaskRow({ id: "task_1", name: "Buy milk" });
    const engine = createSyncEngine(client, {
      push: async (body) => {
        uploads.push(body);
        serverRow = { ...serverRow, ...body.tasks[0] };
        if (uploads.length === 1) {
          await client.run("UPDATE tasks SET name = 'New edit', updated_at = ?, _dirty = 1 WHERE id = 'task_1'", [updatedAt]);
        }
        return { ...emptyPushResponse(), tasks: { applied: ["task_1"], rejected: [] } };
      },
      pull: async (cursors) => ({
        ...emptyPullResponse(cursors),
        tasks: { rows: [serverRow], next_cursor: 1, has_more: false },
      }),
    });
    await engine.fullSync();
    expect(await client.run("SELECT name, _dirty FROM tasks WHERE id = 'task_1'"))
      .toEqual([{ name: "New edit", _dirty: 1 }]);
    await engine.fullSync();
    expect(uploads[1].tasks[0].name).toBe("New edit");
    expect(await client.run("SELECT _dirty FROM tasks WHERE id = 'task_1'"))
      .toEqual([{ _dirty: 0 }]);
  });
});
