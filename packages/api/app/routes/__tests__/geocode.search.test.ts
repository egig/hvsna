import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loader } = await import("../geocode.search");

function makeRequest(query: string) {
  return new Request(`http://api.test/geocode/search${query}`, {
    headers: { Origin: "http://localhost:5173" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /geocode/search", () => {
  it("proxies to Nominatim and passes through the JSON body", async () => {
    const upstreamBody = [{ display_name: "Jakarta, Indonesia", lat: "-6.2", lon: "106.8" }];
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(upstreamBody), { status: 200 }));

    const response = await loader({ request: makeRequest("?q=Jakarta") });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(upstreamBody);

    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toContain("https://nominatim.openstreetmap.org/search?");
    expect(String(calledUrl)).toContain("q=Jakarta");
    expect(String(calledUrl)).toContain("limit=8");
  });

  it("clamps an out-of-range limit", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("[]", { status: 200 }));

    await loader({ request: makeRequest("?q=Jakarta&limit=999") });

    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toContain("limit=20");
  });

  it("returns 400 INVALID_PARAM when q is missing", async () => {
    const response = await loader({ request: makeRequest("") });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_PARAM");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_PARAM when q is blank", async () => {
    const response = await loader({ request: makeRequest("?q=%20%20") });

    expect(response.status).toBe(400);
  });

  it("returns 502 UPSTREAM_ERROR when Nominatim responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 503 }));

    const response = await loader({ request: makeRequest("?q=Jakarta") });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe("UPSTREAM_ERROR");
  });
});
