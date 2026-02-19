import { useEffect } from "react";
import { useLocationSettings } from "../hooks/useLocationSettings";

interface LocationPermissionRequestProps {
  onLocationReady?: (hasLocation: boolean) => void;
  autoRequest?: boolean;
  children?: React.ReactNode;
}

export const LocationPermissionRequest: React.FC<
  LocationPermissionRequestProps
> = ({ onLocationReady, autoRequest = true, children }) => {
  const {
    location,
    loading,
    error,
    hasLocationPermission,
    ensureLocation,
    requestLocationPermission,
  } = useLocationSettings();

  useEffect(() => {
    const initializeLocation = async () => {
      if (autoRequest) {
        const hasLocation = await ensureLocation();
        onLocationReady?.(hasLocation);
      } else {
        // Just check if we already have location
        const hasLocation = !!(
          location?.coordinate && location?.locationResolvedAt
        );
        onLocationReady?.(hasLocation);
      }
    };

    if (!loading) {
      initializeLocation();
    }
  }, [loading, location, autoRequest, ensureLocation, onLocationReady]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-600">Checking location...</div>
      </div>
    );
  }

  if (error && !location?.coordinate) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-2">
        <div className="text-sm text-red-600">Location Error: {error}</div>
        <button
          onClick={requestLocationPermission}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hasLocationPermission && !location?.coordinate) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-2">
        <div className="text-sm text-gray-600">
          Location permission is required
        </div>
        <button
          onClick={requestLocationPermission}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
