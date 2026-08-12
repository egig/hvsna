import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "../jwt";

describe("signAccessToken / verifyAccessToken", () => {
  it("round-trips the userId through the token", async () => {
    const token = await signAccessToken("user-123");
    await expect(verifyAccessToken(token)).resolves.toBe("user-123");
  });

  it("returns null for a garbage token", async () => {
    await expect(verifyAccessToken("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const badToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("a-completely-different-secret"));

    await expect(verifyAccessToken(badToken)).resolves.toBeNull();
  });
});
