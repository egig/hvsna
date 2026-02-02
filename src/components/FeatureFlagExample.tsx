import React from 'react';
import { useFeatureFlags, useFeatureFlag } from '../hooks/useFeatureFlags';

/**
 * Example component demonstrating feature flag usage
 */
export const FeatureFlagExample: React.FC = () => {
  const { flags, isEnabled, getEnabledFlags, getDisabledFlags } = useFeatureFlags();
  const isNewDashboardEnabled = useFeatureFlag('NEW_DASHBOARD');
  const isBetaSearchEnabled = useFeatureFlag('BETA_SEARCH');

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-4">Feature Flags Demo</h2>
      
      {/* Individual flag checks */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium">New Dashboard:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            isNewDashboardEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isNewDashboardEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="font-medium">Beta Search:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            isBetaSearchEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isBetaSearchEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Conditional rendering based on feature flags */}
      {isNewDashboardEnabled && (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          <p className="text-sm">🎉 New Dashboard is available! Check out the latest features.</p>
        </div>
      )}

      {isBetaSearchEnabled && (
        <div className="mb-4 p-3 bg-yellow-100 rounded">
          <p className="text-sm">🔍 Beta Search is enabled. Try our new search functionality!</p>
        </div>
      )}

      {/* Show all enabled/disabled flags */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-medium mb-2">Enabled Features:</h3>
          <ul className="list-disc list-inside space-y-1">
            {getEnabledFlags().map(flag => (
              <li key={flag} className="text-green-700">{flag}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Disabled Features:</h3>
          <ul className="list-disc list-inside space-y-1">
            {getDisabledFlags().map(flag => (
              <li key={flag} className="text-red-700">{flag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
