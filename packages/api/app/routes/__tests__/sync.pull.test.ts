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

/**
 * requireVerifiedAuth's emailVerified lookup is the first db.select call
 * on any authenticated request — queue it ahead of any test-specific
 * mockReturnValueOnce sequence.
 */
function mockVerifiedAuth() {
  db.select.mockReturnValueOnce(createChain([{ emailVerified: true }]));
}

describe("GET /sync/pull", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await loader({ request: makeRequest("") });
    expect(response.status).toBe(401);
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
  });

  it("advances the cursor, signals has_more, and attaches each task's tag_ids", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    const rows = Array.from({ length: 2 }, (_, i) => ({ id: `task_${i}`, rev: i + 1 }));
    // Route pull order: tags, recurring_tasks, tasks, settings — then a
    // follow-up select for the tag_ids of whatever tasks rows came back.
    db.select.mockReturnValueOnce(createChain([])); // tags
    db.select.mockReturnValueOnce(createChain([])); // recurring_tasks
    db.select.mockReturnValueOnce(createChain(rows)); // tasks
    db.select.mockReturnValueOnce(createChain([])); // settings
    // task_tags lookup for task_0/task_1 falls through to the beforeEach default ([])

    const response = await loader({
      request: makeRequest("?limit=2", token),
    });

    const body = await response.json();
    expect(body.data.tasks).toEqual({
      rows: rows.map((r) => ({ ...r, tag_ids: [] })),
      next_cursor: 2,
      has_more: true,
    });
  });

  it("clamps an out-of-range limit", async () => {
    const token = await signAccessToken("user-1");
    mockVerifiedAuth();
    const response = await loader({ request: makeRequest("?limit=999999", token) });
    expect(response.status).toBe(200);
  });
});
