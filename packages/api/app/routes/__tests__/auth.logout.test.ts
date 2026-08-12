import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";

const { db } = vi.hoisted(() => ({ db: { update: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../auth.logout");

function makeRequest(body: unknown) {
  return new Request("http://api.test/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:5173" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /auth/logout", () => {
  it("revokes the refresh token and returns 200", async () => {
    db.update.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest({ refresh_token: "some-token" }) });

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("still returns 200 when no refresh_token is provided (best-effort)", async () => {
    const response = await action({ request: makeRequest({}) });

    expect(response.status).toBe(200);
    expect(db.update).not.toHaveBeenCalled();
  });
});
