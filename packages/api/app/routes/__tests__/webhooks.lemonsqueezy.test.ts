import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChain } from "../../../src/__tests__/mock-db";

const { db } = vi.hoisted(() => ({ db: { insert: vi.fn() } }));

vi.mock("@/db/client", () => ({ db }));

const { action } = await import("../webhooks.lemonsqueezy");

const WEBHOOK_SECRET = "test-only-webhook-secret";

function sign(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

function makeRequest(payload: unknown, { skipSignature = false } = {}) {
  const rawBody = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!skipSignature) headers["X-Signature"] = sign(rawBody);
  return new Request("http://api.test/webhooks/lemonsqueezy", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

const subscriptionPayload = {
  meta: {
    event_name: "subscription_created",
    custom_data: { user_id: "user-1" },
  },
  data: {
    id: "ls-sub-1",
    attributes: {
      customer_id: 111,
      order_id: 222,
      variant_id: 333,
      status: "active",
      card_brand: "visa",
      card_last_four: "4242",
      renews_at: "2026-09-01T00:00:00.000Z",
      ends_at: null,
      trial_ends_at: null,
      urls: {
        update_payment_method: "https://example.com/update",
        customer_portal: "https://example.com/portal",
      },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /webhooks/lemonsqueezy", () => {
  it("upserts the subscription row for a valid signed subscription event", async () => {
    const onConflictDoUpdate = vi.fn(() => Promise.resolve());
    db.insert.mockReturnValue({ values: vi.fn(() => ({ onConflictDoUpdate })) });

    const response = await action({ request: makeRequest(subscriptionPayload) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.handled).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.anything() })
    );
  });

  it("returns 401 INVALID_SIGNATURE for an unsigned request", async () => {
    const response = await action({ request: makeRequest(subscriptionPayload, { skipSignature: true }) });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe("INVALID_SIGNATURE");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 401 INVALID_SIGNATURE when the signature doesn't match the body", async () => {
    const rawBody = JSON.stringify(subscriptionPayload);
    const response = await action({
      request: new Request("http://api.test/webhooks/lemonsqueezy", {
        method: "POST",
        headers: { "X-Signature": sign(JSON.stringify({ different: true })) },
        body: rawBody,
      }),
    });

    expect(response.status).toBe(401);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("ignores non-subscription events without touching the db", async () => {
    const payload = { ...subscriptionPayload, meta: { event_name: "order_created" } };

    const response = await action({ request: makeRequest(payload) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.handled).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("ignores subscription events with no custom_data.user_id", async () => {
    const payload = { ...subscriptionPayload, meta: { event_name: "subscription_updated" } };

    const response = await action({ request: makeRequest(payload) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.handled).toBe(false);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
