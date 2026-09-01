import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckout, getVariantPricing, verifyWebhookSignature } from "../lemonsqueezy";

describe("createCheckout", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the checkout URL from a successful response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { attributes: { url: "https://checkout.example/abc" } } }), {
        status: 201,
      })
    );

    const url = await createCheckout({
      userId: "user-1",
      email: "person@example.com",
      name: "A B",
    });

    expect(url).toBe("https://checkout.example/abc");

    const [calledUrl, calledInit] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toBe("https://api.lemonsqueezy.com/v1/checkouts");
    const body = JSON.parse((calledInit?.body as string) ?? "{}");
    expect(body.data.attributes.checkout_data.custom.user_id).toBe("user-1");
    expect(body.data.attributes.checkout_data.email).toBe("person@example.com");
    expect(body.data.relationships.store.data.id).toBe("1");
    expect(body.data.relationships.variant.data.id).toBe("2");
  });

  it("throws UPSTREAM_ERROR when Lemon Squeezy responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 422 }));

    await expect(
      createCheckout({ userId: "user-1", email: "person@example.com", name: "A B" })
    ).rejects.toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
  });

  it("throws UPSTREAM_ERROR when the fetch itself throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    await expect(
      createCheckout({ userId: "user-1", email: "person@example.com", name: "A B" })
    ).rejects.toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
  });

  it("throws UPSTREAM_ERROR when the response has no checkout URL", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 201 }));

    await expect(
      createCheckout({ userId: "user-1", email: "person@example.com", name: "A B" })
    ).rejects.toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
  });
});

describe("getVariantPricing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the variant's price from a successful response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { attributes: { price: 300, is_subscription: true, interval: "month", interval_count: 1 } },
        }),
        { status: 200 }
      )
    );

    const pricing = await getVariantPricing();

    expect(pricing).toEqual({
      priceCents: 300,
      currency: "USD",
      isSubscription: true,
      interval: "month",
      intervalCount: 1,
    });
    const [calledUrl] = vi.mocked(fetch).mock.calls[0];
    expect(String(calledUrl)).toBe("https://api.lemonsqueezy.com/v1/variants/2");
  });

  it("throws UPSTREAM_ERROR when Lemon Squeezy responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 500 }));

    await expect(getVariantPricing()).rejects.toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
  });

  it("throws UPSTREAM_ERROR when the response has no price", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));

    await expect(getVariantPricing()).rejects.toMatchObject({ status: 502, code: "UPSTREAM_ERROR" });
  });
});

describe("verifyWebhookSignature", () => {
  const secret = "test-only-webhook-secret";

  function sign(body: string): string {
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  it("accepts a signature matching the raw body", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects a signature computed over a different body", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(verifyWebhookSignature(body, sign(JSON.stringify({ hello: "there" })))).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyWebhookSignature(JSON.stringify({ a: 1 }), null)).toBe(false);
  });

  it("rejects a malformed (non-hex, wrong-length) signature", () => {
    expect(verifyWebhookSignature(JSON.stringify({ a: 1 }), "not-a-real-signature")).toBe(false);
  });
});
