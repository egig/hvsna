import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../auth.resend-verification");

function makeRequest(token?: string) {
  const headers: Record<string, string> = { Origin: "http://localhost:5173" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/auth/resend-verification", { method: "POST", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.delete.mockReturnValue(createChain([]));
  db.insert.mockReturnValue(createChain([]));
});

describe("POST /auth/resend-verification", () => {
  it("returns 401 TOKEN_EXPIRED without a bearer token", async () => {
    const response = await action({ request: makeRequest() });
    expect(response.status).toBe(401);
  });

  it("issues and sends a new token when the user is unverified", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(
      createChain([{ id: "user-1", email: "person@example.com", emailVerified: false }])
    );

    const response = await action({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
  });

  it("is a no-op when the user is already verified", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(
      createChain([{ id: "user-1", email: "person@example.com", emailVerified: true }])
    );

    const response = await action({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 401 TOKEN_EXPIRED when the user no longer exists", async () => {
    const token = await signAccessToken("deleted-user");
    db.select.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest(token) });

    expect(response.status).toBe(401);
  });
});
