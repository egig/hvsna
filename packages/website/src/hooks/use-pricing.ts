import { useEffect, useState } from "react";
import { API_URL } from "@/config";

export interface Pricing {
  priceCents: number;
  currency: string;
  interval: string | null;
  intervalCount: number | null;
}

/**
 * Fetches the real Sync plan price from @hvsna/api client-side only, so the
 * prerendered (crawler-facing) HTML keeps non-numeric, SEO-safe copy and
 * never bakes in a number that can drift from what Lemon Squeezy charges.
 */
export function usePricing(): Pricing | null {
  const [pricing, setPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/pricing`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data?: Pricing } | null) => {
        if (!cancelled && body?.data) setPricing(body.data);
      })
      .catch(() => {
        // Keep the SEO-safe fallback copy on failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
}

export function formatPrice(pricing: Pricing): string {
  const amount = (pricing.priceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: pricing.currency,
    minimumFractionDigits: pricing.priceCents % 100 === 0 ? 0 : 2,
  });
  return pricing.interval ? `${amount}/${pricing.interval}` : amount;
}
