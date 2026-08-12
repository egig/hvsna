import { describe, expect, it } from "vitest";
import { hashPassword, isPasswordValid, verifyPassword } from "../password";

describe("isPasswordValid", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(isPasswordValid("short1")).toBe(false);
  });

  it("accepts an 8+ character string", () => {
    expect(isPasswordValid("password123")).toBe(true);
  });

  it("rejects non-string values", () => {
    expect(isPasswordValid(12345678)).toBe(false);
    expect(isPasswordValid(undefined)).toBe(false);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("produces a hash that verifies against the original password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword(hash, "correct-horse-battery-staple")).resolves.toBe(true);
  });

  it("fails verification against the wrong password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });
});
