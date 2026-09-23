import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { insert: vi.fn(), select: vi.fn(), execute: vi.fn(), batch: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../sync.push");

function makeRequest(body: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/sync/push", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const taskRow = {
  id: "task_1",
  name: "Buy milk",
  description: null,
  status: 0,
  recurring_task_id: null,
  tag_ids: ["tag_1"],
  created_at: 1000,
  updated_at: 2000,
  completed_at: null,
  deleted_at: null,
};

const { id: _id, updated_at: _u, deleted_at: _d, ...taskPayload } = taskRow;

const storedTask = {
  userId: "user-1",
  entityType: "tasks",
  id: "task_1",
  payload: taskPayload,
  updatedAt: 2000,
  deletedAt: null,
  rev: 7,
};

const emptyResult = { applied: [], rejected: [] };

beforeEach(() => {
  vi.clearAllMocks();
  db.select.mockReturnValue(createChain([]));
  db.insert.mockReturnValue(createChain([]));
  db.execute.mockReturnValue(createChain([]));
});

/**
 * requireSyncAuth's users ⟕ subscriptions lookup is the first db.select call
 * on any authenticated request — queue it ahead of any test-specific
 * mockReturnValueOnce sequence.
 */
function mockVerifiedAuth() {
  db.select.mockReturnValueOnce(
    createChain([{ emailVerified: true, subscriptionStatus: "active", subscriptionEndsAt: null }])
  );
}

/** The chain handed to the n-th db.insert call, to inspect its .values(). */
function insertedValues(call = 0) {
  const chain = db.insert.mock.results[call].value as {
    values: { mock: { calls: [Record<string, unknown>[]][] } };
  };
  return chain.values.mock.calls[0][0];
}

async function push(body: unknown) {
  const token = await signAccessToken("user-1");
  mockVerifiedAuth();
  return action({ request: makeRequest(body, token) });
}

describe("POST /sync/push", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await action({ request: makeRequest({}) });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 403 SYNC_PLAN_REQUIRED when the user has no Sync plan", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValueOnce(
      createChain([{ emailVerified: true, subscriptionStatus: null, subscriptionEndsAt: null }])
    );

    const response = await action({ request: makeRequest({}, token) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("SYNC_PLAN_REQUIRED");
  });

  it("returns 403 EMAIL_NOT_VERIFIED when the user hasn't verified their email", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValueOnce(createChain([{ emailVerified: false }]));

    const response = await action({
      request: makeRequest({ tasks: [taskRow] }, token),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it.each([
    ["a row without updated_at", { tasks: [{ id: "task_1" }] }],
    ["a row without an id", { tasks: [{ updated_at: 1 }] }],
    ["a settings row without a key", { settings: [{ id: "theme", value: "x", updated_at: 1 }] }],
    ["a non-numeric deleted_at", { tasks: [{ ...taskRow, deleted_at: "yesterday" }] }],
    ["a non-array type", { tasks: taskRow }],
    ["a malformed type name", { "Tasks!": [taskRow] }],
    ["too many rows", { tasks: Array.from({ length: 501 }, (_, i) => ({ ...taskRow, id: `t${i}` })) }],
    ["an oversized payload", { tasks: [{ ...taskRow, description: "x".repeat(70 * 1024) }] }],
    [
      "too many types",
      Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`type_${"a".repeat(i + 1)}`, []])),
    ],
  ])("returns 400 INVALID_REQUEST for %s", async (_label, body) => {
    const response = await push(body);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("INVALID_REQUEST");
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("skips the database when there is nothing to push, still reporting every shipped type", async () => {
    const response = await push({ tasks: [], settings: [] });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      tasks: emptyResult,
      recurring_tasks: emptyResult,
      settings: emptyResult,
      tags: emptyResult,
    });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("locks, upserts and reads back in one batch, reporting applied rows", async () => {
    // lock, tasks upsert, tasks read-back
    db.batch.mockResolvedValueOnce([[], [{ id: "task_1" }], [storedTask]]);

    const response = await push({ tasks: [taskRow] });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks).toEqual({ applied: ["task_1"], rejected: [] });
    expect(body.data.recurring_tasks).toEqual(emptyResult);
    expect(body.data.settings).toEqual(emptyResult);
    expect(body.data.tags).toEqual(emptyResult);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const items = db.batch.mock.calls[0][0] as unknown[];
    expect(items).toHaveLength(3);
    expect(items[0]).toBe(db.execute.mock.results[0].value);
  });

  it("stores everything but the envelope as the payload", async () => {
    db.batch.mockResolvedValueOnce([[], [{ id: "task_1" }], [storedTask]]);

    await push({ tasks: [{ ...taskRow, rev: 3, priority: 2 }] });

    expect(insertedValues()).toEqual([
      {
        userId: "user-1",
        entityType: "tasks",
        id: "task_1",
        payload: { ...taskPayload, priority: 2 },
        updatedAt: 2000,
        deletedAt: null,
      },
    ]);
  });

  it("uses settings' key as the row id", async () => {
    db.batch.mockResolvedValueOnce([[], [{ id: "theme" }], []]);

    const response = await push({ settings: [{ key: "theme", value: "dark", updated_at: 5 }] });

    const body = await response.json();
    expect(body.data.settings).toEqual({ applied: ["theme"], rejected: [] });
    expect(insertedValues()[0]).toMatchObject({
      entityType: "settings",
      id: "theme",
      payload: { value: "dark" },
      deletedAt: null,
    });
  });

  it("reports a stale row as rejected with the server's current row in wire shape", async () => {
    const newer = { ...storedTask, payload: { ...taskPayload, name: "Buy oat milk" }, updatedAt: 9999 };
    db.batch.mockResolvedValueOnce([[], [], [newer]]);

    const response = await push({ tasks: [taskRow] });

    const body = await response.json();
    expect(body.data.tasks.applied).toEqual([]);
    expect(body.data.tasks.rejected).toEqual([
      {
        id: "task_1",
        server_row: { ...taskRow, name: "Buy oat milk", updated_at: 9999, rev: 7 },
      },
    ]);
  });

  it("accepts and reports a type the server has never seen", async () => {
    db.batch.mockResolvedValueOnce([[], [{ id: "rem_1" }], []]);

    const response = await push({ reminders: [{ id: "rem_1", text: "hi", updated_at: 1 }] });

    const body = await response.json();
    expect(body.data.reminders).toEqual({ applied: ["rem_1"], rejected: [] });
    expect(body.data.tasks).toEqual(emptyResult);
  });

  it("collapses a repeated id to its newest version", async () => {
    db.batch.mockResolvedValueOnce([[], [{ id: "task_1" }], []]);

    await push({
      tasks: [
        { ...taskRow, name: "newest", updated_at: 3000 },
        { ...taskRow, name: "older", updated_at: 2500 },
      ],
    });

    const values = insertedValues();
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ updatedAt: 3000, payload: { name: "newest" } });
  });

  it("upserts each type once and reads each back", async () => {
    db.batch.mockResolvedValueOnce([[], [{ id: "tag_1" }], [{ id: "task_1" }], [], []]);

    const response = await push({
      tags: [{ id: "tag_1", name: "urgent", color: "#fff", created_at: 1, updated_at: 1 }],
      tasks: [taskRow],
    });

    const body = await response.json();
    expect(body.data.tags).toEqual({ applied: ["tag_1"], rejected: [] });
    expect(body.data.tasks).toEqual({ applied: ["task_1"], rejected: [] });
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.batch.mock.calls[0][0]).toHaveLength(5);
  });
});
