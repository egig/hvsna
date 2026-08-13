import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn(), update: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../auth.verify-email");

function makeRequest(body: unknown) {
  return new Request("http://api.test/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /auth/verify-email", () => {
  it("marks the user verified for a valid token", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() + 1_000_000),
          createdAt: new Date(),
        },
      ])
    );
    db.delete.mockReturnValue(createChain([]));
    db.update.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ token: "valid-token" }) });

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("returns 400 INVALID_TOKEN for an unknown token", async () => {
    db.select.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ token: "unknown" }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_TOKEN");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_REQUEST when no token is provided", async () => {
    const response = await action({ request: makeRequest({}) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_REQUEST");
  });
});
