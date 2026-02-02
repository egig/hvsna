# Feature Flags System

This project includes a simple but powerful feature flag system that allows you to enable/disable features per environment.

## How it works

The feature flag system consists of:

1. **Types** (`src/lib/types/featureFlags.ts`) - TypeScript interfaces for type safety
2. **Configuration** (`src/lib/featureFlags.ts`) - Environment-specific flag definitions
3. **React Hooks** (`src/hooks/useFeatureFlags.ts`) - Easy integration with React components

## Environment Configuration

Feature flags are configured per feature in `src/lib/featureFlags.ts`:

```typescript
export const featureFlagConfig: FeatureFlagConfig = {
  NEW_DASHBOARD: ['development', 'staging'],
  BETA_SEARCH: ['development', 'staging'],
  ADVANCED_ANALYTICS: ['development'],
  DARK_MODE: ['development', 'staging', 'production'],
  OFFLINE_MODE: ['development'],
  EXPERIMENTAL_UI: ['development'],
};
```

Each feature lists the environments where it's enabled. This makes it easy to see at a glance which environments have access to each feature.

## Usage in Components

### Using the main hook

```tsx
import { useFeatureFlags } from '../hooks/useFeatureFlags';

function MyComponent() {
  const { isEnabled, getEnabledFlags } = useFeatureFlags();
  
  if (isEnabled('NEW_DASHBOARD')) {
    return <NewDashboard />;
  }
  
  return <OldDashboard />;
}
```

### Using the specific flag hook

```tsx
import { useFeatureFlag } from '../hooks/useFeatureFlags';

function SearchComponent() {
  const isBetaSearchEnabled = useFeatureFlag('BETA_SEARCH');
  
  return (
    <div>
      {isBetaSearchEnabled ? (
        <BetaSearch />
      ) : (
        <LegacySearch />
      )}
    </div>
  );
}
```

## Setting up environments

1. Copy `.env.example` to `.env.local`
2. Set the `MODE` environment variable:
   - `development` (default)
   - `staging` 
   - `production`

### Environment-specific setup

#### Development
```bash
# .env.local
MODE=development
```

#### Staging
```bash
# .env.local
MODE=staging
```

#### Production
```bash
# .env.local  
MODE=production
```

## Adding new feature flags

1. Add the flag to the configuration in `src/lib/featureFlags.ts` with the environments where it should be enabled
2. Use the flag in your components with the hooks
3. Test across different environments

Example:
```typescript
// In featureFlags.ts
export const featureFlagConfig: FeatureFlagConfig = {
  // ... existing flags
  NEW_FEATURE_X: ['development', 'staging'],
};
```

## Available flags

Current feature flags (customize as needed):

- `NEW_DASHBOARD` - New dashboard interface
- `BETA_SEARCH` - Beta search functionality
- `ADVANCED_ANALYTICS` - Advanced analytics features
- `DARK_MODE` - Dark mode theme
- `OFFLINE_MODE` - Offline functionality
- `EXPERIMENTAL_UI` - Experimental UI components

## Testing

The example component `src/components/FeatureFlagExample.tsx` demonstrates all usage patterns and can be used for testing different flag configurations.
