import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../__tests__/mock-db";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { issueEmailVerificationToken, consumeEmailVerificationToken, buildVerificationUrl } =
  await import("../verification-tokens");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("issueEmailVerificationToken", () => {
  it("clears prior tokens and inserts a hashed token row, returning the raw token", async () => {
    db.delete.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    const token = await issueEmailVerificationToken("user-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(db.delete).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });
});

describe("consumeEmailVerificationToken", () => {
  it("returns null for an unknown token", async () => {
    db.select.mockReturnValue(createChain([]));

    await expect(consumeEmailVerificationToken("unknown")).resolves.toBeNull();
  });

  it("returns null for an expired token", async () => {
    db.select.mockReturnValue(
      createChain([
        {
          id: "row-1",
          userId: "user-1",
          tokenHash: "x",
          expiresAt: new Date(Date.now() - 1000),
          createdAt: new Date(),
        },
      ])
    );

    await expect(consumeEmailVerificationToken("expired")).resolves.toBeNull();
  });

  it("deletes the row and returns the userId for a valid token", async () => {
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

    await expect(consumeEmailVerificationToken("valid")).resolves.toBe("user-1");
    expect(db.delete).toHaveBeenCalled();
  });
});

describe("buildVerificationUrl", () => {
  it("builds a link under APP_URL with the token as a query param", () => {
    const originalAppUrl = process.env.APP_URL;
    process.env.APP_URL = "https://app.example.com/";

    try {
      expect(buildVerificationUrl("abc123")).toBe(
        "https://app.example.com/verify-email?token=abc123"
      );
    } finally {
      process.env.APP_URL = originalAppUrl;
    }
  });
});
