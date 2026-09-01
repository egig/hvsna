import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loader } = await import("../pricing");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /pricing", () => {
  it("returns the configured variant's price", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { attributes: { price: 300, is_subscription: true, interval: "month", interval_count: 1 } },
        }),
        { status: 200 }
      )
    );

    const response = await loader();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      priceCents: 300,
      currency: "USD",
      isSubscription: true,
      interval: "month",
      intervalCount: 1,
    });
  });

  it("returns UPSTREAM_ERROR when Lemon Squeezy responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 500 }));

    const response = await loader();

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe("UPSTREAM_ERROR");
  });
});
