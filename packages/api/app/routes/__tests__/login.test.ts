import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { hashPassword } from "../../../src/lib/password";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../login");

function makeRequest(body: unknown, origin = "http://localhost:5173") {
  return new Request("http://api.test/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /login", () => {
  it("returns access + refresh tokens for valid credentials", async () => {
    const passwordHash = await hashPassword("correct-password");
    db.select
      .mockReturnValueOnce(createChain([])) // throttle check: no prior attempts
      .mockReturnValueOnce(
        createChain([
          {
            id: "user-1",
            email: "person@example.com",
            passwordHash,
            firstName: "A",
            lastName: "B",
            createdAt: new Date(),
          },
        ])
      );
    db.delete.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const response = await action({
      request: makeRequest({ email: "person@example.com", password: "correct-password" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.access_token).toEqual(expect.any(String));
    expect(body.data.refresh_token).toEqual(expect.any(String));
    expect(db.delete).toHaveBeenCalled();
  });

  it("returns 401 INVALID_CREDENTIALS for a wrong password", async () => {
    const passwordHash = await hashPassword("correct-password");
    db.select
      .mockReturnValueOnce(createChain([])) // throttle check
      .mockReturnValueOnce(
        createChain([
          {
            id: "user-1",
            email: "person@example.com",
            passwordHash,
            firstName: "A",
            lastName: "B",
            createdAt: new Date(),
          },
        ])
      )
      .mockReturnValueOnce(createChain([])); // recordLoginFailure's own lookup
    db.insert.mockReturnValue(createChain([]));

    const response = await action({
      request: makeRequest({ email: "person@example.com", password: "wrong-password" }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("INVALID_CREDENTIALS");
    expect(db.insert).toHaveBeenCalled();
  });

  it("returns 401 INVALID_CREDENTIALS when the user doesn't exist", async () => {
    db.select.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const response = await action({
      request: makeRequest({ email: "nobody@example.com", password: "whatever1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 429 TOO_MANY_ATTEMPTS once the throttle threshold is hit", async () => {
    db.select.mockReturnValueOnce(
      createChain([{ email: "person@example.com", failCount: 5, firstFailedAt: new Date() }])
    );

    const response = await action({
      request: makeRequest({ email: "person@example.com", password: "whatever1" }),
    });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.code).toBe("TOO_MANY_ATTEMPTS");
  });

  it("returns 400 INVALID_REQUEST when email/password are missing", async () => {
    const response = await action({ request: makeRequest({ email: "person@example.com" }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_REQUEST");
  });
});
