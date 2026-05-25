import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LocationUseCases } from "./usecase";
import { createLocationProvider } from "@/infra";
import { TimeAPITimezoneProvider } from "@/infra/location/TimeAPITimezoneProvider";
import { useSettings } from "../settings";
import {
  LocationPickerModal,
  type Location,
} from "../components/location-picker-modal";
import type { LocationSetting } from "../settings/settings";
import { useNetworkContext } from "../network/context";
import { useSnackbar } from "../components/snackbar-provider";

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    zoom: "10",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: { "User-Agent": "hvsna/1.0 (egigundari@gmail.com)" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  let displayName =
    data.address.county ?? data.address.city ?? data.address.display_name;
  if (!!data.address.municipality) {
    displayName = `${data.address.municipality}, ${displayName}`;
  }

  return displayName;
}

interface LocationContextType {
  loading: boolean;
  location: Location;
  timezone: string;
  error: string;
  requestLocationPermission: Function;
  ensureLocation: Function;
}

const LacationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const useLocationContext = () => {
  const context = useContext(LacationContext);
  if (!context) {
    throw new Error(
      "useLocaitonContext must be used within a LocationProvider"
    );
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { updateSettings, settings } = useSettings();
  const { initiated: networkInit, isOnline } = useNetworkContext();
  const { showSnackbar } = useSnackbar();

  const useCases = new LocationUseCases(
    createLocationProvider(),
    new TimeAPITimezoneProvider()
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError("");
      setLoading(true);
      const coordinate = await useCases.requestLocation({
        timeout: 5000,
        maximumAge: 0,
      });

      let placeName = await reverseGeocode(
        coordinate.latitude,
        coordinate.longitude
      );
      let t = await useCases.getTimezoneFromCoordinates(
        coordinate.latitude,
        coordinate.longitude
      );

      await updateSettings({
        timezone: t as string,
        location: {
          name: placeName ?? (t as string),
          lat: coordinate.latitude,
          lng: coordinate.longitude,
          resolvedAt: new Date().valueOf(),
          source: "auto",
        },
      });

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get location permission"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePickLocation = async (location: Location) => {
    await updateSettings({
      location: {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        resolvedAt: new Date().valueOf(),
        source: "manual",
      },
    });
  };

  const isLocationUptodate = () => {
    if (!settings?.location) {
      return [false, false];
    }

    const { resolvedAt, lat, lng, source, name } =
      settings?.location as LocationSetting;
    let hasLocation = resolvedAt > 0 && !!lat && !!lng && !!name;
    // We do not re-prompt location picker if user was manually select location
    if (hasLocation && source === "manual") {
      return [true, true];
    }

    let resolvedAnHourAgo = new Date().valueOf() - resolvedAt < 60 * 60 * 1000;
    return [hasLocation, resolvedAnHourAgo];
  };

  const ensureLocation = async () => {
    (async () => {
      let granted = await requestLocationPermission();
      if (!granted) {
        setIsLocationModalOpen(true);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      if (networkInit && !isOnline) {
        return;
      }

      const [hasLocation, resolvedAnHourAgo] = isLocationUptodate();
      if (hasLocation && resolvedAnHourAgo) {
        return;
      }

      let granted = await requestLocationPermission();
      if (!granted) {
        // For display location picker it its no location before
        if (!hasLocation) {
          setIsLocationModalOpen(true);
          return;
        }

        showSnackbar(
          <div className="flex items-center justify-between w-full">
            <span>Can not get updated location</span>
          </div>,
          { autoHideDuration: 5000, showCloseButton: true }
        );
      }
    })();
  }, [settings, networkInit, isOnline]);

  return (
    <LacationContext.Provider
      value={{
        loading,
        location: {
          lat: settings.location?.lat as number,
          lng: settings.location?.lng as number,
          name: settings.location?.name as string,
        },
        timezone: settings.timezone,
        error,
        requestLocationPermission,
        ensureLocation,
      }}
    >
      {children}

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        value={settings.location?.name || ""}
        onSelect={handlePickLocation}
        title={"Select Location"}
        data-testid="location-picker-modal"
        dismissable={false}
      />
    </LacationContext.Provider>
  );
};
