import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../__tests__/mock-db";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { issueRefreshToken, revokeRefreshToken, rotateRefreshToken, TokenReuseDetectedError } =
  await import("../tokens");

function tokenRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "row-1",
    userId: "user-1",
    familyId: "fam-1",
    tokenHash: "x",
    expiresAt: new Date(Date.now() + 1_000_000),
    revokedAt: null,
    replacedByTokenId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("issueRefreshToken", () => {
  it("inserts a hashed token row and returns the raw token", async () => {
    db.insert.mockReturnValue(createChain([]));

    const token = await issueRefreshToken("user-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("rotateRefreshToken", () => {
  it("returns null when the token is unknown", async () => {
    db.select.mockReturnValue(createChain([]));

    await expect(rotateRefreshToken("unknown")).resolves.toBeNull();
  });

  it("returns null when the token is unrevoked but expired", async () => {
    db.select.mockReturnValue(createChain([tokenRow({ expiresAt: new Date(Date.now() - 1000) })]));

    await expect(rotateRefreshToken("expired-token")).resolves.toBeNull();
  });

  it("revokes the old token and issues a new one in the same family for a valid token", async () => {
    db.select.mockReturnValue(createChain([tokenRow()]));
    db.update.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const result = await rotateRefreshToken("valid-token");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-1");
    expect(typeof result?.refreshToken).toBe("string");
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("replays a lost-response retry: revoked token whose successor is still the live tip, within the grace window", async () => {
    const successor = tokenRow({ id: "row-2", tokenHash: "y", revokedAt: null, replacedByTokenId: null });
    const revoked = tokenRow({ revokedAt: new Date(), replacedByTokenId: "row-2" });
    db.select.mockReturnValueOnce(createChain([revoked])).mockReturnValueOnce(createChain([successor]));
    db.update.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const result = await rotateRefreshToken("stale-but-recent-token");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-1");
    expect(db.insert).toHaveBeenCalled();
  });

  it("treats a revoked token outside the grace window as reuse and revokes the whole family", async () => {
    const successor = tokenRow({ id: "row-2", tokenHash: "y", revokedAt: null, replacedByTokenId: null });
    const revoked = tokenRow({
      revokedAt: new Date(Date.now() - 60_000),
      replacedByTokenId: "row-2",
    });
    db.select.mockReturnValueOnce(createChain([revoked])).mockReturnValueOnce(createChain([successor]));
    db.update.mockReturnValue(createChain([]));

    await expect(rotateRefreshToken("old-stale-token")).rejects.toBeInstanceOf(
      TokenReuseDetectedError
    );
    expect(db.update).toHaveBeenCalled();
  });

  it("treats a revoked token whose successor has itself moved on as reuse", async () => {
    const successor = tokenRow({ id: "row-2", tokenHash: "y", revokedAt: new Date() });
    const revoked = tokenRow({ revokedAt: new Date(), replacedByTokenId: "row-2" });
    db.select.mockReturnValueOnce(createChain([revoked])).mockReturnValueOnce(createChain([successor]));
    db.update.mockReturnValue(createChain([]));

    await expect(rotateRefreshToken("superseded-token")).rejects.toBeInstanceOf(
      TokenReuseDetectedError
    );
    expect(db.update).toHaveBeenCalled();
  });

  it("treats a revoked token with no successor (e.g. logged out) as reuse if redeemed again", async () => {
    db.select.mockReturnValue(createChain([tokenRow({ revokedAt: new Date(), replacedByTokenId: null })]));
    db.update.mockReturnValue(createChain([]));

    await expect(rotateRefreshToken("logged-out-token")).rejects.toBeInstanceOf(
      TokenReuseDetectedError
    );
    expect(db.update).toHaveBeenCalled();
  });
});

describe("revokeRefreshToken", () => {
  it("updates the matching row's revokedAt", async () => {
    db.update.mockReturnValue(createChain([]));

    await revokeRefreshToken("some-token");

    expect(db.update).toHaveBeenCalled();
  });
});
