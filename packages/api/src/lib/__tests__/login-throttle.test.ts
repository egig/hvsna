import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../__tests__/mock-db";

const { db } = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/db/client", () => ({ db }));

const { isLoginThrottled, recordLoginFailure, clearLoginAttempts } = await import(
  "../login-throttle"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isLoginThrottled", () => {
  it("is false when there's no prior attempt row", async () => {
    db.select.mockReturnValue(createChain([]));

    await expect(isLoginThrottled("a@example.com")).resolves.toBe(false);
  });

  it("is false when fail count is under the ceiling", async () => {
    db.select.mockReturnValue(
      createChain([{ email: "a@example.com", failCount: 4, firstFailedAt: new Date() }])
    );

    await expect(isLoginThrottled("a@example.com")).resolves.toBe(false);
  });

  it("is true when fail count is at the ceiling within the window", async () => {
    db.select.mockReturnValue(
      createChain([{ email: "a@example.com", failCount: 5, firstFailedAt: new Date() }])
    );

    await expect(isLoginThrottled("a@example.com")).resolves.toBe(true);
  });

  it("is false once the window has elapsed, even at/above the ceiling", async () => {
    db.select.mockReturnValue(
      createChain([
        { email: "a@example.com", failCount: 9, firstFailedAt: new Date(Date.now() - 16 * 60 * 1000) },
      ])
    );

    await expect(isLoginThrottled("a@example.com")).resolves.toBe(false);
  });
});

describe("recordLoginFailure", () => {
  it("inserts a fresh window when there's no prior row", async () => {
    db.select.mockReturnValue(createChain([]));
    db.insert.mockReturnValue(createChain([]));

    await recordLoginFailure("a@example.com");

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("increments the existing row within the window", async () => {
    db.select.mockReturnValue(
      createChain([{ email: "a@example.com", failCount: 2, firstFailedAt: new Date() }])
    );
    db.update.mockReturnValue(createChain([]));

    await recordLoginFailure("a@example.com");

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("starts a new window (via upsert) once the previous one has expired", async () => {
    db.select.mockReturnValue(
      createChain([
        { email: "a@example.com", failCount: 5, firstFailedAt: new Date(Date.now() - 16 * 60 * 1000) },
      ])
    );
    db.insert.mockReturnValue(createChain([]));

    await recordLoginFailure("a@example.com");

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("clearLoginAttempts", () => {
  it("deletes the row for the email", async () => {
    db.delete.mockReturnValue(createChain([]));

    await clearLoginAttempts("a@example.com");

    expect(db.delete).toHaveBeenCalled();
  });
});
