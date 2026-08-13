import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain, createRejectingChain } from "../../../src/__tests__/mock-db";

const { db } = vi.hoisted(() => ({ db: { insert: vi.fn(), delete: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../register");

function makeRequest(body: unknown) {
  return new Request("http://api.test/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.delete.mockReturnValue(createChain([]));
});

describe("POST /register", () => {
  it("creates a user and returns access + refresh tokens", async () => {
    db.insert.mockReturnValue(createChain([{ id: "user-1" }]));

    const response = await action({
      request: makeRequest({
        email: "New@Example.com",
        password: "supersecret1",
        firstName: "Jane",
        lastName: "Doe",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.access_token).toEqual(expect.any(String));
    expect(body.data.refresh_token).toEqual(expect.any(String));
  });

  it("returns 409 EMAIL_TAKEN on a unique constraint violation", async () => {
    // drizzle-orm/neon-http wraps the real Postgres error (with .code) in
    // .cause on a DrizzleQueryError — this is the actual shape it throws,
    // not a flat { code } object.
    const queryError = new Error("Failed query");
    (queryError as { cause?: unknown }).cause = { code: "23505" };
    db.insert.mockReturnValue(createRejectingChain(queryError));

    const response = await action({
      request: makeRequest({ email: "dup@example.com", password: "supersecret1" }),
    });

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("EMAIL_TAKEN");
  });

  it("returns 400 INVALID_REQUEST for an invalid email", async () => {
    const response = await action({
      request: makeRequest({ email: "not-an-email", password: "supersecret1" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 400 INVALID_REQUEST for a short password", async () => {
    const response = await action({
      request: makeRequest({ email: "ok@example.com", password: "short" }),
    });

    expect(response.status).toBe(400);
  });

  it("issues an email verification token alongside the user", async () => {
    db.insert.mockReturnValue(createChain([{ id: "user-1" }]));

    await action({
      request: makeRequest({ email: "new@example.com", password: "supersecret1" }),
    });

    // one insert each for: the user row, the refresh token, the verification token
    expect(db.insert).toHaveBeenCalledTimes(3);
  });

  it("still succeeds even if sending the verification email fails", async () => {
    db.insert.mockReturnValue(createChain([{ id: "user-1" }]));
    const originalEnv = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 })
    );

    try {
      const response = await action({
        request: makeRequest({ email: "new@example.com", password: "supersecret1" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.access_token).toEqual(expect.any(String));
      expect(fetchSpy).toHaveBeenCalled();
    } finally {
      process.env.RESEND_API_KEY = originalEnv;
      fetchSpy.mockRestore();
    }
  });
});
