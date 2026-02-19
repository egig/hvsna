import { useLocationSettings } from "../hooks/useLocationSettings";
import { LocationRequestButton } from "./OptionalLocation";

export const LocationInfo: React.FC = () => {
  const {
    location,
    hasLocationPermission,
    loading,
    error,
    requestLocationPermission,
    getCurrentLocation,
    updateLocation,
    ensureLocation,
    setManualLocation,
    clearLocation,
  } = useLocationSettings();

  const handleAutoLocation = async () => {
    const coordinate = await getCurrentLocation();
    if (coordinate) {
      await updateLocation(coordinate, "auto");
    }
  };

  const handleManualLocation = async () => {
    // Example: Jakarta coordinates
    await setManualLocation(-6.2088, 106.8456);
  };

  if (loading) {
    return <div className="p-4">Loading location...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Location Information (Optional)</h3>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Location is optional. You can use the app
          without enabling location. Some features may work better with location
          enabled.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="space-y-2">
        <p>
          <strong>Permission Status:</strong>{" "}
          {hasLocationPermission ? "✅ Granted" : "❌ Not Granted"}
        </p>
        <p>
          <strong>Location Set:</strong>{" "}
          {location.coordinate ? "✅ Yes" : "❌ No"}
        </p>
        {location.locationResolvedAt && (
          <p>
            <strong>Resolved At:</strong>{" "}
            {new Date(location.locationResolvedAt).toLocaleString()}
          </p>
        )}
        {location.locationResolveType && (
          <p>
            <strong>Resolve Type:</strong> {location.locationResolveType}
          </p>
        )}
        {location.coordinate && (
          <div>
            <p>
              <strong>Coordinates:</strong>
            </p>
            <p>Latitude: {location.coordinate.latitude}</p>
            <p>Longitude: {location.coordinate.longitude}</p>
            {location.coordinate.accuracy && (
              <p>Accuracy: {location.coordinate.accuracy}m</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!hasLocationPermission && (
          <LocationRequestButton
            onLocationGranted={() => console.log("Location granted!")}
          />
        )}

        {hasLocationPermission && (
          <>
            <button
              onClick={handleAutoLocation}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Get Current Location
            </button>

            <button
              onClick={handleManualLocation}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Set Manual Location (Jakarta)
            </button>

            <button
              onClick={clearLocation}
              disabled={!location.coordinate}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              Clear Location
            </button>

            <button
              onClick={ensureLocation}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Ensure Location
            </button>
          </>
        )}
      </div>
    </div>
  );
};
