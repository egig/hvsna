import { useCallback, useMemo } from "react";
import { useAuthContext } from "../auth/auth-context";
import type { FeatureFlags } from "./types";

/**
 * Hook for accessing feature flags in React components
 */
export const useFeatureFlags = () => {
  const { user } = useAuthContext();

  const flags = useMemo((): FeatureFlags => {
    // Use feature flags from user data, fallback to empty object if not available
    return user?.featureFlags || {};
  }, [user]);

  const isEnabled = useCallback(
    (flagKey: string): boolean => {
      return flags[flagKey] || false;
    },
    [flags],
  );

  const getEnabledFlags = useCallback((): string[] => {
    return Object.entries(flags)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }, [flags]);

  const getDisabledFlags = useCallback((): string[] => {
    return Object.entries(flags)
      .filter(([, enabled]) => !enabled)
      .map(([key]) => key);
  }, [flags]);

  return {
    flags,
    isEnabled,
    getEnabledFlags,
    getDisabledFlags,
  };
};

/**
 * Hook for checking a specific feature flag
 */
export const useFeatureFlag = (flagKey: string): boolean => {
  return useFeatureFlags().isEnabled(flagKey);
};
