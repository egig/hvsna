import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";
import { requireAuth } from "@/lib/require-auth";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";

export async function loader({ request }: { request: Request }) {
  try {
    const userId = await requireAuth(request);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription) {
      return jsonOk({ subscription: null });
    }

    return jsonOk({
      subscription: {
        status: subscription.status,
        renewsAt: subscription.renewsAt?.toISOString() ?? null,
        endsAt: subscription.endsAt?.toISOString() ?? null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
        cardBrand: subscription.cardBrand,
        cardLastFour: subscription.cardLastFour,
        updatePaymentMethodUrl: subscription.updatePaymentMethodUrl,
        customerPortalUrl: subscription.customerPortalUrl,
      },
    });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
