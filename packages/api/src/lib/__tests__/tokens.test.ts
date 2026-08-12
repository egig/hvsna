import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../__tests__/mock-db";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { issueRefreshToken, revokeRefreshToken, rotateRefreshToken } = await import("../tokens");

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

  it("returns null when the token is already revoked", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: new Date(),
          createdAt: new Date(),
        },
      ])
    );

    await expect(rotateRefreshToken("revoked-token")).resolves.toBeNull();
  });

  it("returns null when the token is expired", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() - 1000),
          revokedAt: null,
          createdAt: new Date(),
        },
      ])
    );

    await expect(rotateRefreshToken("expired-token")).resolves.toBeNull();
  });

  it("revokes the old token and issues a new one for a valid token", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() + 1_000_000),
          revokedAt: null,
          createdAt: new Date(),
        },
      ])
    );
    db.update.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const result = await rotateRefreshToken("valid-token");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-1");
    expect(typeof result?.refreshToken).toBe("string");
    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("revokeRefreshToken", () => {
  it("updates the matching row's revokedAt", async () => {
    db.update.mockReturnValue(createChain([]));

    await revokeRefreshToken("some-token");

    expect(db.update).toHaveBeenCalled();
  });
});
