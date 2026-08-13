import type { ISubscriptionRepository } from "@/domain/subscription/ISubscriptionRepository";
import { ApiSubscriptionRepository } from "./ApiSubscriptionRepository";

let subscriptionRepositoryInstance: ISubscriptionRepository | null = null;

export function getSubscriptionRepository(): ISubscriptionRepository {
  if (!subscriptionRepositoryInstance) {
    subscriptionRepositoryInstance = new ApiSubscriptionRepository();
  }
  return subscriptionRepositoryInstance;
}

/** Reset the singleton — for testing only */
export function _resetSubscriptionRepositorySingleton(): void {
  subscriptionRepositoryInstance = null;
}
