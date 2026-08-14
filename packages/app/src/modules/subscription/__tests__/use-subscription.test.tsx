import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSubscription } from "../use-subscription";

const mockGetSubscription = vi.fn();
const mockCreateCheckoutSession = vi.fn();
let mockIsAuthenticated = true;

vi.mock("@/infra/subscription/SubscriptionRepositoryFactory", () => ({
  getSubscriptionRepository: () => ({
    getSubscription: mockGetSubscription,
    createCheckoutSession: mockCreateCheckoutSession,
  }),
}));

vi.mock("@/modules/auth", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated = true;
});

describe("useSubscription", () => {
  it("returns null when the user has no subscription", async () => {
    mockGetSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toBeNull();
  });

  it("exposes the subscription once loaded", async () => {
    const subscription = {
      status: "active",
      renewsAt: "2026-09-01T00:00:00.000Z",
      endsAt: null,
      trialEndsAt: null,
      cardBrand: "visa",
      cardLastFour: "4242",
      updatePaymentMethodUrl: null,
      customerPortalUrl: null,
    };
    mockGetSubscription.mockResolvedValue(subscription);

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toEqual(subscription);
  });

  it("does not fetch when the user isn't authenticated, and reports loading: false", async () => {
    mockIsAuthenticated = false;

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetSubscription).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it("startCheckout redirects to the returned checkout URL", async () => {
    mockGetSubscription.mockResolvedValue(null);
    mockCreateCheckoutSession.mockResolvedValue("https://checkout.example/abc");
    const originalLocation = window.location;
    const fakeLocation = { href: "" } as unknown as Location;
    Object.defineProperty(window, "location", { value: fakeLocation, writable: true });

    const { result } = renderHook(() => useSubscription(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.startCheckout();

    expect(fakeLocation.href).toBe("https://checkout.example/abc");
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });
});
