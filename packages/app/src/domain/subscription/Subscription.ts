export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export interface Subscription {
  status: SubscriptionStatus;
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  updatePaymentMethodUrl: string | null;
  customerPortalUrl: string | null;
}
