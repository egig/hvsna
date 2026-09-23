/**
 * Whether a user's Lemon Squeezy subscription currently entitles them to the
 * paid Sync plan — the single rule both /sync/* (via requireSyncAuth) and
 * /me's `syncEnabled` flag use, so clients never disagree with the server.
 *
 * - `on_trial`, `active`: entitled.
 * - `past_due`: entitled — Lemon Squeezy is still retrying the renewal
 *   payment, and the subscription is still live during that dunning window.
 * - `cancelled`: entitled until `ends_at` — the customer cancelled but keeps
 *   what they already paid for until the billing period runs out.
 * - `paused`, `unpaid`, `expired` (and anything unknown): not entitled.
 */
export function hasSyncEntitlement(
  subscription: { status: string; endsAt: Date | null } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription) return false;
  switch (subscription.status) {
    case "on_trial":
    case "active":
    case "past_due":
      return true;
    case "cancelled":
      return subscription.endsAt !== null && subscription.endsAt.getTime() > now.getTime();
    default:
      return false;
  }
}
