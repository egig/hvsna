import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), batch: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { loader } = await import("../sync.pull");

function makeRequest(query: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request(`http://api.test/sync/pull${query}`, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.select.mockReturnValue(createChain([]));
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

describe("GET /sync/pull", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await loader({ request: makeRequest("") });
    expect(response.status).toBe(401);
  });

  it("returns 403 SYNC_PLAN_REQUIRED when the user has no Sync plan", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValueOnce(
      createChain([{ emailVerified: true, subscriptionStatus: null, subscriptionEndsAt: null }])
    );

    const response = await loader({ request: makeRequest("", token) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("SYNC_PLAN_REQUIRED");
  });

  it("returns 403 EMAIL_NOT_VERIFIED when the user hasn't verified their email", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValueOnce(createChain([{ emailVerified: false }]));

    const response = await loader({ request: makeRequest("", token) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns empty pages with cursors unchanged when nothing changed", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    db.batch.mockResolvedValueOnce([[], [], [], []]);

    const response = await loader({
      request: makeRequest(
        "?tasks_cursor=10&recurring_tasks_cursor=3&settings_cursor=1&tags_cursor=2",
        token
      ),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks).toEqual({ rows: [], next_cursor: 10, has_more: false });
    expect(body.data.recurring_tasks).toEqual({ rows: [], next_cursor: 3, has_more: false });
    expect(body.data.settings).toEqual({ rows: [], next_cursor: 1, has_more: false });
    expect(body.data.tags).toEqual({ rows: [], next_cursor: 2, has_more: false });
    // One query per type, all in a single batch (one snapshot, one round trip).
    expect(db.batch.mock.calls[0][0]).toHaveLength(4);
  });

  it("reassembles wire rows, advances the cursor and signals has_more", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    const stored = Array.from({ length: 2 }, (_, i) => ({
      userId: "user-1",
      entityType: "tasks",
      id: `task_${i}`,
      payload: { name: `Task ${i}`, tag_ids: ["tag_1"] },
      updatedAt: 100 + i,
      deletedAt: i === 1 ? 500 : null,
      rev: i + 1,
    }));
    const setting = {
      userId: "user-1",
      entityType: "settings",
      id: "theme",
      payload: { value: "dark" },
      updatedAt: 5,
      deletedAt: null,
      rev: 9,
    };
    // Batch order follows the always-reported types: tasks, recurring_tasks, settings, tags.
    db.batch.mockResolvedValueOnce([stored, [], [setting], []]);

    const response = await loader({ request: makeRequest("?limit=2", token) });

    const body = await response.json();
    expect(body.data.tasks).toEqual({
      rows: [
        { id: "task_0", name: "Task 0", tag_ids: ["tag_1"], updated_at: 100, deleted_at: null, rev: 1 },
        { id: "task_1", name: "Task 1", tag_ids: ["tag_1"], updated_at: 101, deleted_at: 500, rev: 2 },
      ],
      next_cursor: 2,
      has_more: true,
    });
    expect(body.data.settings.rows).toEqual([
      { key: "theme", value: "dark", updated_at: 5, deleted_at: null, rev: 9 },
    ]);
  });

  it("pages a type the server has never seen when the client sends its cursor", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    db.batch.mockResolvedValueOnce([[], [], [], [], []]);

    const response = await loader({ request: makeRequest("?reminders_cursor=4", token) });

    const body = await response.json();
    expect(body.data.reminders).toEqual({ rows: [], next_cursor: 4, has_more: false });
    expect(Object.keys(body.data).sort()).toEqual([
      "recurring_tasks",
      "reminders",
      "settings",
      "tags",
      "tasks",
    ]);
  });

  it("returns 400 INVALID_REQUEST for a malformed type name", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();

    const response = await loader({ request: makeRequest("?Tasks!_cursor=0", token) });

    expect(response.status).toBe(400);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("clamps an out-of-range limit", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    db.batch.mockResolvedValueOnce([[], [], [], []]);
    const response = await loader({ request: makeRequest("?limit=999999", token) });
    expect(response.status).toBe(200);
  });
});
