import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../__tests__/mock-db";
import { signAccessToken } from "../jwt";

const { db } = vi.hoisted(() => ({ db: { select: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { requireAuth, requireSyncAuth } = await import("../require-auth");

function makeRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return new Request("http://api.test/sync/push", { headers });
}

describe("requireAuth", () => {
  it("returns the userId encoded in a valid access token", async () => {
    const token = await signAccessToken("user-1");
    await expect(requireAuth(makeRequest(token))).resolves.toBe("user-1");
  });

  it("throws 401 TOKEN_EXPIRED when the Authorization header is missing", async () => {
    await expect(requireAuth(makeRequest())).rejects.toMatchObject({
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  });

  it("throws 401 TOKEN_EXPIRED for an invalid token", async () => {
    await expect(requireAuth(makeRequest("garbage"))).rejects.toMatchObject({
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  });
});

function syncRow(overrides: Record<string, unknown> = {}) {
  return {
    emailVerified: true,
    subscriptionStatus: "active",
    subscriptionEndsAt: null,
    ...overrides,
  };
}

describe("requireSyncAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the userId for a verified user with an active Sync plan", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(createChain([syncRow()]));

    await expect(requireSyncAuth(makeRequest(token))).resolves.toBe("user-1");
  });

  it("throws 403 EMAIL_NOT_VERIFIED when the user hasn't verified their email", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(createChain([syncRow({ emailVerified: false })]));

    await expect(requireSyncAuth(makeRequest(token))).rejects.toMatchObject({
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("throws 403 SYNC_PLAN_REQUIRED when the user has no subscription", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(
      createChain([syncRow({ subscriptionStatus: null, subscriptionEndsAt: null })])
    );

    await expect(requireSyncAuth(makeRequest(token))).rejects.toMatchObject({
      status: 403,
      code: "SYNC_PLAN_REQUIRED",
    });
  });

  it("throws 403 SYNC_PLAN_REQUIRED when the subscription has expired", async () => {
    const token = await signAccessToken("user-1");
    db.select.mockReturnValue(createChain([syncRow({ subscriptionStatus: "expired" })]));

    await expect(requireSyncAuth(makeRequest(token))).rejects.toMatchObject({
      status: 403,
      code: "SYNC_PLAN_REQUIRED",
    });
  });

  it("throws 401 TOKEN_EXPIRED when the user no longer exists", async () => {
    const token = await signAccessToken("deleted-user");
    db.select.mockReturnValue(createChain([]));

    await expect(requireSyncAuth(makeRequest(token))).rejects.toMatchObject({
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  });

  it("throws 401 TOKEN_EXPIRED without a bearer token", async () => {
    await expect(requireSyncAuth(makeRequest())).rejects.toMatchObject({
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  });
});
