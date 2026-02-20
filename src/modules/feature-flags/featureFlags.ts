import type { FeatureFlagConfig, Environment, FeatureFlags } from "./types";

/**
 * Get current environment from import.meta.env or default to development
 */
export const getCurrentEnvironment = (): Environment => {
  const env = import.meta.env.MODE || "development";

  // Validate that it's a supported environment
  if (["development", "staging", "production"].includes(env)) {
    return env as Environment;
  }

  return "development";
};

/**
 * Feature flag configuration per feature
 * Each feature lists the environments where it's enabled
 */
export const featureFlagConfig: FeatureFlagConfig = {
  TRACKER_ATTR: [],
  GOAL_RANGE: [],
};

/**
 * Get feature flags for the current environment
 */
export const getFeatureFlags = (): FeatureFlags => {
  const currentEnv = getCurrentEnvironment();
  const flags: FeatureFlags = {};

  // Convert the feature-centric config to environment-centric flags
  Object.entries(featureFlagConfig).forEach(
    ([featureName, enabledEnvironments]) => {
      flags[featureName] = enabledEnvironments.includes(currentEnv);
    },
  );

  return flags;
};

/**
 * Check if a specific feature flag is enabled
 */
export const isFeatureEnabled = (flagKey: string): boolean => {
  const flags = getFeatureFlags();
  return flags[flagKey] || false;
};
