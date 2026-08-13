import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loader } = await import("../geocode.reverse");

function makeRequest(query: string) {
  return new Request(`http://api.test/geocode/reverse${query}`, {
    headers: { Origin: "http://localhost:5173" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /geocode/reverse", () => {
  it("proxies to Nominatim and passes through the JSON body", async () => {
    const upstreamBody = { display_name: "Jakarta, Indonesia", address: { city: "Jakarta" } };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(upstreamBody), { status: 200 }));

    const response = await loader({ request: makeRequest("?lat=-6.2&lon=106.8") });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual(upstreamBody);

    const [calledUrl, calledInit] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toContain("https://nominatim.openstreetmap.org/reverse?");
    expect(String(calledUrl)).toContain("lat=-6.2");
    expect(String(calledUrl)).toContain("lon=106.8");
    expect((calledInit?.headers as Record<string, string>)["User-Agent"]).toBeTruthy();
  });

  it("returns 400 INVALID_PARAM when lat is missing", async () => {
    const response = await loader({ request: makeRequest("?lon=106.8") });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_PARAM");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 INVALID_PARAM when lon is not a number", async () => {
    const response = await loader({ request: makeRequest("?lat=-6.2&lon=abc") });

    expect(response.status).toBe(400);
  });

  it("returns 502 UPSTREAM_ERROR when Nominatim responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 503 }));

    const response = await loader({ request: makeRequest("?lat=-6.2&lon=106.8") });

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe("UPSTREAM_ERROR");
  });

  it("returns 502 UPSTREAM_ERROR when the fetch itself throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const response = await loader({ request: makeRequest("?lat=-6.2&lon=106.8") });

    expect(response.status).toBe(502);
  });
});
