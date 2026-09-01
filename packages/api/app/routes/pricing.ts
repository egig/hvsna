import { getVariantPricing } from "@/lib/lemonsqueezy";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";

/**
 * Public (unauthenticated) — the marketing site fetches this client-side to
 * show a real price instead of a hardcoded one that drifts from whatever is
 * actually configured in Lemon Squeezy.
 */
export async function loader() {
  try {
    const pricing = await getVariantPricing();
    return jsonOk(pricing);
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
