import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn() },
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

describe("GET /sync/pull", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await loader({ request: makeRequest("") });
    expect(response.status).toBe(401);
  });

  it("returns empty pages with cursors unchanged when nothing changed", async () => {
    const token = await signAccessToken("user-1");
    const response = await loader({
      request: makeRequest("?tasks_cursor=10&recurring_tasks_cursor=3&settings_cursor=1", token),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.tasks).toEqual({ rows: [], next_cursor: 10, has_more: false });
    expect(body.data.recurring_tasks).toEqual({ rows: [], next_cursor: 3, has_more: false });
    expect(body.data.settings).toEqual({ rows: [], next_cursor: 1, has_more: false });
  });

  it("advances the cursor and signals has_more when a full page is returned", async () => {
    const token = await signAccessToken("user-1");
    const rows = Array.from({ length: 2 }, (_, i) => ({ id: `task_${i}`, rev: i + 1 }));
    db.select.mockReturnValueOnce(createChain([])); // recurring_tasks
    db.select.mockReturnValueOnce(createChain(rows)); // tasks
    db.select.mockReturnValueOnce(createChain([])); // settings

    const response = await loader({
      request: makeRequest("?limit=2", token),
    });

    const body = await response.json();
    expect(body.data.tasks).toEqual({ rows, next_cursor: 2, has_more: true });
  });

  it("clamps an out-of-range limit", async () => {
    const token = await signAccessToken("user-1");
    const response = await loader({ request: makeRequest("?limit=999999", token) });
    expect(response.status).toBe(200);
  });
});
