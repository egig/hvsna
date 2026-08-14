import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";
import { signAccessToken } from "../../../src/lib/jwt";

const { db } = vi.hoisted(() => ({ db: { select: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { loader } = await import("../subscription");

function makeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/subscription", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /subscription", () => {
  it("returns subscription: null when the user has no subscription row", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(createChain([]));

    const response = await loader({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.subscription).toBeNull();
  });

  it("returns the subscription status for a subscribed user", async () => {
    const token = await signAccessToken("user-1");
    const renewsAt = new Date("2026-09-01T00:00:00Z");
    db.select.mockReturnValue(
      createChain([
        {
          userId: "user-1",
          status: "active",
          renewsAt,
          endsAt: null,
          trialEndsAt: null,
          cardBrand: "visa",
          cardLastFour: "4242",
          updatePaymentMethodUrl: "https://example.com/update",
          customerPortalUrl: "https://example.com/portal",
        },
      ])
    );

    const response = await loader({ request: makeRequest(token) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.subscription).toEqual({
      status: "active",
      renewsAt: renewsAt.toISOString(),
      endsAt: null,
      trialEndsAt: null,
      cardBrand: "visa",
      cardLastFour: "4242",
      updatePaymentMethodUrl: "https://example.com/update",
      customerPortalUrl: "https://example.com/portal",
    });
  });

  it("returns 401 TOKEN_EXPIRED when no access token is provided", async () => {
    const response = await loader({ request: makeRequest() });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("TOKEN_EXPIRED");
  });
});
