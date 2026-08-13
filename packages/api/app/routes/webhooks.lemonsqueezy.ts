import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";
import {
  verifyWebhookSignature,
  type LemonSqueezyWebhookPayload,
} from "@/lib/lemonsqueezy";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";

/**
 * Receives Lemon Squeezy's subscription lifecycle events (created, updated,
 * cancelled, resumed, expired, paused, unpaused, payment_*) and upserts the
 * one `subscriptions` row for the user identified by `meta.custom_data.
 * user_id` (stamped into the checkout by createCheckout in
 * src/lib/lemonsqueezy.ts). Every subscription event carries the full
 * current attributes, so a single upsert-from-payload handles all of them
 * identically — there's no per-event-type branching to keep in sync with
 * Lemon Squeezy's event list.
 */
export async function action({ request }: { request: Request }) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Signature");
    if (!verifyWebhookSignature(rawBody, signature)) {
      throw new ApiError(401, "INVALID_SIGNATURE", "Webhook signature is missing or invalid");
    }

    let payload: LemonSqueezyWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new ApiError(400, "INVALID_REQUEST", "Webhook body must be valid JSON");
    }

    if (!payload.meta.event_name.startsWith("subscription_")) {
      return jsonOk({ handled: false });
    }

    const userId = payload.meta.custom_data?.user_id;
    if (!userId) {
      return jsonOk({ handled: false });
    }

    const attributes = payload.data.attributes;
    await db
      .insert(subscriptions)
      .values({
        userId,
        lemonSqueezySubscriptionId: payload.data.id,
        lemonSqueezyCustomerId: String(attributes.customer_id),
        lemonSqueezyOrderId: String(attributes.order_id),
        variantId: String(attributes.variant_id),
        status: attributes.status,
        renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
        endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
        trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
        cardBrand: attributes.card_brand,
        cardLastFour: attributes.card_last_four,
        updatePaymentMethodUrl: attributes.urls.update_payment_method ?? null,
        customerPortalUrl: attributes.urls.customer_portal ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          lemonSqueezySubscriptionId: payload.data.id,
          lemonSqueezyCustomerId: String(attributes.customer_id),
          lemonSqueezyOrderId: String(attributes.order_id),
          variantId: String(attributes.variant_id),
          status: attributes.status,
          renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
          trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
          cardBrand: attributes.card_brand,
          cardLastFour: attributes.card_last_four,
          updatePaymentMethodUrl: attributes.urls.update_payment_method ?? null,
          customerPortalUrl: attributes.urls.customer_portal ?? null,
          updatedAt: new Date(),
        },
      });

    return jsonOk({ handled: true });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
