import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./response";

const API_BASE = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return key;
}

function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  return id;
}

function getVariantId(): string {
  const id = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!id) throw new Error("LEMONSQUEEZY_VARIANT_ID is not set");
  return id;
}

function getWebhookSecret(): string {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
  return secret;
}

function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL is not set");
  return url;
}

export interface CreateCheckoutParams {
  userId: string;
  email: string;
  name: string;
}

/**
 * Creates a hosted Lemon Squeezy checkout for the app's single paid
 * variant, stamping the user id into `checkout_data.custom` so the webhook
 * (which only sees Lemon Squeezy's own subscription/customer ids) can tell
 * which user a subscription belongs to.
 */
export async function createCheckout(params: CreateCheckoutParams): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: params.email,
              name: params.name,
              custom: { user_id: params.userId },
            },
            product_options: {
              redirect_url: `${getAppUrl()}/settings/subscription?checkout=success`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: getStoreId() } },
            variant: { data: { type: "variants", id: getVariantId() } },
          },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(502, "UPSTREAM_ERROR", "Failed to reach Lemon Squeezy");
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "UPSTREAM_ERROR",
      `Lemon Squeezy checkout request failed (${response.status})`
    );
  }

  const body = (await response.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = body.data?.attributes?.url;
  if (!url) {
    throw new ApiError(502, "UPSTREAM_ERROR", "Lemon Squeezy response did not include a checkout URL");
  }
  return url;
}

/**
 * Verifies the `X-Signature` header against an HMAC-SHA256 digest of the
 * raw request body. Must run on the raw text, before any JSON.parse, since
 * Lemon Squeezy signs the exact bytes it sent.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", getWebhookSecret()).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signatureHeader, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export interface VariantPricing {
  priceCents: number;
  currency: string;
  isSubscription: boolean;
  interval: string | null;
  intervalCount: number | null;
}

/**
 * Fetches the price of the app's single paid variant, so the marketing
 * site can display a real figure instead of a hardcoded one that drifts
 * from whatever is actually configured in Lemon Squeezy.
 */
export async function getVariantPricing(): Promise<VariantPricing> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/variants/${getVariantId()}`, {
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(502, "UPSTREAM_ERROR", "Failed to reach Lemon Squeezy");
  }

  if (!response.ok) {
    throw new ApiError(502, "UPSTREAM_ERROR", `Lemon Squeezy variant request failed (${response.status})`);
  }

  const body = (await response.json()) as {
    data?: {
      attributes?: {
        price?: number;
        is_subscription?: boolean;
        interval?: string | null;
        interval_count?: number | null;
      };
    };
  };
  const attributes = body.data?.attributes;
  if (typeof attributes?.price !== "number") {
    throw new ApiError(502, "UPSTREAM_ERROR", "Lemon Squeezy response did not include a price");
  }

  return {
    priceCents: attributes.price,
    currency: "USD",
    isSubscription: attributes.is_subscription ?? true,
    interval: attributes.interval ?? null,
    intervalCount: attributes.interval_count ?? null,
  };
}

export interface LemonSqueezySubscriptionAttributes {
  customer_id: number;
  order_id: number;
  variant_id: number;
  status: string;
  card_brand: string | null;
  card_last_four: string | null;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  urls: {
    update_payment_method?: string;
    customer_portal?: string;
  };
}

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: LemonSqueezySubscriptionAttributes;
  };
}
