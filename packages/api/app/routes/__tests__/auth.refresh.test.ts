import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";

const { db } = vi.hoisted(() => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../auth.refresh");

function makeRequest(body: unknown) {
  return new Request("http://api.test/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /auth/refresh", () => {
  it("rotates the refresh token and returns a new pair for a valid token", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          familyId: "fam-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
          replacedByTokenId: null,
          createdAt: new Date(),
        },
      ])
    );
    db.update.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ refresh_token: "valid-token" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.access_token).toEqual(expect.any(String));
    expect(body.data.refresh_token).toEqual(expect.any(String));
  });

  it("returns 401 TOKEN_EXPIRED for an unknown or expired token", async () => {
    db.select.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ refresh_token: "unknown" }) });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 401 TOKEN_REUSE_DETECTED when an already-revoked token is redeemed again", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          familyId: "fam-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: new Date(),
          replacedByTokenId: null,
          createdAt: new Date(),
        },
      ])
    );
    db.update.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ refresh_token: "revoked-token" }) });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_REUSE_DETECTED");
  });

  it("returns 400 INVALID_REQUEST when refresh_token is missing", async () => {
    const response = await action({ request: makeRequest({}) });

    expect(response.status).toBe(400);
  });
});
