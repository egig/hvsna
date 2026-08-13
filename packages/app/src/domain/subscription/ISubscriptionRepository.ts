import type { Subscription } from "./Subscription";

export interface ISubscriptionRepository {
  /** Returns the current user's subscription, or null if they're on the free plan. */
  getSubscription(): Promise<Subscription | null>;

  /** Creates a Lemon Squeezy checkout session and returns its hosted URL. */
  createCheckoutSession(): Promise<string>;
}
