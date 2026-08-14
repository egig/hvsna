import { beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }));

vi.mock("@/modules/api/http-client", () => ({ api }));

const { ApiSubscriptionRepository } = await import("../ApiSubscriptionRepository");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApiSubscriptionRepository", () => {
  describe("getSubscription", () => {
    it("returns null when the user has no subscription", async () => {
      api.get.mockResolvedValue({
        code: "OK",
        message: "OK",
        data: { subscription: null },
      });

      const repo = new ApiSubscriptionRepository();
      const result = await repo.getSubscription();

      expect(result).toBeNull();
      expect(api.get).toHaveBeenCalledWith("/subscription");
    });

    it("returns the subscription for a subscribed user", async () => {
      const subscription = {
        status: "active",
        renewsAt: "2026-09-01T00:00:00.000Z",
        endsAt: null,
        trialEndsAt: null,
        cardBrand: "visa",
        cardLastFour: "4242",
        updatePaymentMethodUrl: "https://example.com/update",
        customerPortalUrl: "https://example.com/portal",
      };
      api.get.mockResolvedValue({ code: "OK", message: "OK", data: { subscription } });

      const repo = new ApiSubscriptionRepository();
      const result = await repo.getSubscription();

      expect(result).toEqual(subscription);
    });
  });

  describe("createCheckoutSession", () => {
    it("returns the checkout URL", async () => {
      api.post.mockResolvedValue({
        code: "OK",
        message: "OK",
        data: { url: "https://checkout.example/abc" },
      });

      const repo = new ApiSubscriptionRepository();
      const url = await repo.createCheckoutSession();

      expect(url).toBe("https://checkout.example/abc");
      expect(api.post).toHaveBeenCalledWith("/subscription/checkout");
    });
  });
});
