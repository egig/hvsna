import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubscriptionRepository } from "@/infra/subscription/SubscriptionRepositoryFactory";
import { useAuth } from "@/modules/auth";
import { queryKeys } from "@/modules/query-keys";

export function useSubscription() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const repo = getSubscriptionRepository();

  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: () => repo.getSubscription(),
    enabled: isAuthenticated,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => repo.createCheckoutSession(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.subscription() });

  const startCheckout = async (): Promise<void> => {
    const url = await checkoutMutation.mutateAsync();
    window.location.href = url;
  };

  return {
    subscription: subscriptionQuery.data ?? null,
    // The query is disabled while signed out, which leaves it permanently
    // "pending" rather than settled — fall back to `false` so the page
    // doesn't spin forever for a signed-out visitor.
    loading: isAuthenticated && subscriptionQuery.isPending,
    error: subscriptionQuery.error instanceof Error ? subscriptionQuery.error.message : null,
    isStartingCheckout: checkoutMutation.isPending,
    checkoutError: checkoutMutation.error instanceof Error ? checkoutMutation.error.message : null,
    startCheckout,
    refresh,
  };
}
