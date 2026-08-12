import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { insert: vi.fn(), select: vi.fn() },
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
  tags: null,
  created_at: 1000,
  updated_at: 2000,
  completed_at: null,
  deleted_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /sync/push", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await action({ request: makeRequest({}) });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 400 INVALID_REQUEST for a malformed task row", async () => {
    const token = await signAccessToken("user-1");
    const response = await action({
      request: makeRequest({ tasks: [{ id: "task_1" }] }, token),
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_REQUEST");
  });

  it("upserts applied rows and reports them back", async () => {
    const token = await signAccessToken("user-1");
    db.insert.mockReturnValueOnce(createChain([{ id: "task_1" }]));

    const response = await action({
      request: makeRequest({ tasks: [taskRow] }, token),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks).toEqual({ applied: ["task_1"], rejected: [] });
    expect(body.data.recurring_tasks).toEqual({ applied: [], rejected: [] });
    expect(body.data.settings).toEqual({ applied: [], rejected: [] });
  });

  it("reports a stale row as rejected with the winning server row", async () => {
    const token = await signAccessToken("user-1");
    const serverRow = { ...taskRow, updated_at: 9999, rev: 5 };
    db.insert.mockReturnValueOnce(createChain([])); // conflict predicate rejected the row
    db.select.mockReturnValueOnce(createChain([serverRow]));

    const response = await action({
      request: makeRequest({ tasks: [taskRow] }, token),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks.applied).toEqual([]);
    expect(body.data.tasks.rejected).toEqual([{ id: "task_1", server_row: serverRow }]);
  });
});
