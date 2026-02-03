/**
 * Feature flag system types
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export type Environment = "development" | "staging" | "production";

export interface FeatureFlagConfig {
  [featureName: string]: Environment[];
}
