import { describe, expect, it, vi } from "vitest";
import { corsMiddleware } from "../cors";

function makeRequest(method: string, origin = "http://localhost:5173") {
  return new Request("http://api.test/login", { method, headers: { Origin: origin } });
}

describe("corsMiddleware", () => {
  it("short-circuits OPTIONS with a 204 preflight response, never calling next()", async () => {
    const next = vi.fn();

    const response = await corsMiddleware({ request: makeRequest("OPTIONS") }, next);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() for non-OPTIONS requests and attaches CORS headers to its response", async () => {
    const next = vi.fn(async () => Response.json({ ok: true }, { status: 201 }));

    const response = await corsMiddleware({ request: makeRequest("POST") }, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).toBe(201);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("omits Access-Control-Allow-Origin for a disallowed origin", async () => {
    const next = vi.fn(async () => Response.json({ ok: true }));

    const response = await corsMiddleware(
      { request: makeRequest("POST", "http://evil.example.com") },
      next
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
