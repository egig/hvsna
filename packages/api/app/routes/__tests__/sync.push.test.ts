import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { insert: vi.fn(), select: vi.fn(), delete: vi.fn() },
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
  at_time: null,
  at_epoch_millis: null,
  lat: null,
  lng: null,
  timezone: null,
  recurring_type: null,
  recurring_interval: null,
  recurring_task_id: null,
  hijri_date_offset: null,
  duration_minutes: 15,
  tag_ids: [],
  created_at: 1000,
  updated_at: 2000,
  completed_at: null,
  deleted_at: null,
};

const emptyResult = { applied: [], rejected: [] };

beforeEach(() => {
  vi.clearAllMocks();
  // Association replace (task_tags/recurring_task_tags) and the tag-id
  // lookup for rejected rows fall back to this whenever a test doesn't
  // care about them.
  db.select.mockReturnValue(createChain([]));
  db.delete.mockReturnValue(createChain([]));
});

/**
 * requireVerifiedAuth's emailVerified lookup is the first db.select call
 * on any authenticated request — queue it ahead of any test-specific
 * mockReturnValueOnce sequence.
 */
function mockVerifiedAuth() {
  db.select.mockReturnValueOnce(createChain([{ emailVerified: true }]));
}

describe("POST /sync/push", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await action({ request: makeRequest({}) });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
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

  it("returns 400 INVALID_REQUEST for a malformed task row", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    const response = await action({
      request: makeRequest({ tasks: [{ id: "task_1" }] }, token),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_REQUEST");
  });

  it("upserts applied rows and reports them back", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    db.insert.mockReturnValueOnce(createChain([{ id: "task_1" }]));

    const response = await action({
      request: makeRequest({ tasks: [taskRow] }, token),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks).toEqual({ applied: ["task_1"], rejected: [] });
    expect(body.data.recurring_tasks).toEqual(emptyResult);
    expect(body.data.settings).toEqual(emptyResult);
    expect(body.data.tags).toEqual(emptyResult);
    // Membership is replaced (deleted then re-inserted) for every applied
    // row, even one with no tags, so a locally-cleared tag list propagates.
    expect(db.delete).toHaveBeenCalled();
  });

  it("reports a stale row as rejected with the winning server row and its current tags", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    const serverRow = { ...taskRow, updated_at: 9999, rev: 5 };
    db.insert.mockReturnValueOnce(createChain([])); // conflict predicate rejected the row
    db.select.mockReturnValueOnce(createChain([serverRow])); // rejected-row lookup

    const response = await action({
      request: makeRequest({ tasks: [taskRow] }, token),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks.applied).toEqual([]);
    expect(body.data.tasks.rejected).toEqual([
      { id: "task_1", server_row: { ...serverRow, tag_ids: [] } },
    ]);
  });

  it("pushes tags before recurring_tasks and tasks", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    db.insert.mockReturnValueOnce(createChain([{ id: "tag_1" }])); // tags
    db.insert.mockReturnValueOnce(createChain([{ id: "task_1" }])); // tasks (no recurring_tasks sent, so pushRecurringTasks never calls insert)

    const response = await action({
      request: makeRequest(
        { tags: [{ id: "tag_1", name: "urgent", color: "#fff", created_at: 1, updated_at: 1, deleted_at: null }], tasks: [taskRow] },
        token
      ),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tags).toEqual({ applied: ["tag_1"], rejected: [] });
    expect(body.data.tasks).toEqual({ applied: ["task_1"], rejected: [] });
  });
});
