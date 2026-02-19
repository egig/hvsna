import { useCallback, useMemo } from "react";
import { getFeatureFlags, isFeatureEnabled } from "./featureFlags";

/**
 * Hook for accessing feature flags in React components
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => getFeatureFlags(), []);

  const isEnabled = useCallback((flagKey: string): boolean => {
    return isFeatureEnabled(flagKey);
  }, []);

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
