import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({ db: { select: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { loader } = await import("../me");

function makeRequest(token?: string) {
  const headers: Record<string, string> = { Origin: "http://localhost:5173" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/me", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /me", () => {
  it("returns the current user for a valid access token", async () => {
    const token = await signAccessToken("user-1");
    const createdAt = new Date("2026-01-01T00:00:00Z");
    db.select.mockReturnValue(
      createChain([
        {
          id: "user-1",
          email: "person@example.com",
          passwordHash: "irrelevant",
          firstName: "A",
          lastName: "B",
          createdAt,
        },
      ])
    );

    const response = await loader({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      userId: "user-1",
      firstName: "A",
      lastName: "B",
      email: "person@example.com",
      createdAt: createdAt.toISOString(),
      featureFlags: {},
    });
  });

  it("returns 401 TOKEN_EXPIRED when the Authorization header is missing", async () => {
    const response = await loader({ request: makeRequest() });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 401 TOKEN_EXPIRED for an invalid token", async () => {
    const response = await loader({ request: makeRequest("garbage") });

    expect(response.status).toBe(401);
  });

  it("returns 401 TOKEN_EXPIRED when the user no longer exists", async () => {
    const token = await signAccessToken("deleted-user");
    db.select.mockReturnValue(createChain([]));

    const response = await loader({ request: makeRequest(token) });

    expect(response.status).toBe(401);
  });
});
