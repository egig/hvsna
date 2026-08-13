import type { ISubscriptionRepository } from "@/domain/subscription/ISubscriptionRepository";
import type { Subscription } from "@/domain/subscription/Subscription";
import { api } from "@/modules/api/http-client";

interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

export class ApiSubscriptionRepository implements ISubscriptionRepository {
  async getSubscription(): Promise<Subscription | null> {
    const response = await api.get<BaseResponse<{ subscription: Subscription | null }>>(
      "/subscription"
    );
    return response.data.subscription;
  }

  async createCheckoutSession(): Promise<string> {
    const response = await api.post<BaseResponse<{ url: string }>>("/subscription/checkout");
    return response.data.url;
  }
}
