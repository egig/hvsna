import { describe, expect, it } from "vitest";
import { signAccessToken } from "../jwt";
import { requireAuth } from "../require-auth";

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
