import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({ db: { select: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../subscription.checkout");

function makeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/subscription/checkout", { method: "POST", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /subscription/checkout", () => {
  it("creates a Lemon Squeezy checkout for the authenticated user and returns its URL", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(
      createChain([
        { id: "user-1", email: "person@example.com", firstName: "A", lastName: "B" },
      ])
    );
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { attributes: { url: "https://checkout.example/abc" } } }), {
        status: 201,
      })
    );

    const response = await action({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.url).toBe("https://checkout.example/abc");
  });

  it("returns 401 TOKEN_EXPIRED when no access token is provided", async () => {
    const response = await action({ request: makeRequest() });

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 401 TOKEN_EXPIRED when the user no longer exists", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(createChain([]));

    const response = await action({ request: makeRequest(token) });

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
