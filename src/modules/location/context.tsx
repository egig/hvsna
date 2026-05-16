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
  const { updateSettings, settings, initiated } = useSettings();

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
      // TODO get place name, set timezone as fallback
      const t = await useCases.getTimezoneFromCoordinates(
        coordinate.latitude,
        coordinate.longitude
      );

      await updateSettings({
        location: {
          name: t as string,
          lat: coordinate.latitude,
          lng: coordinate.longitude,
          resolvedAt: new Date().valueOf(),
          source: "auto"
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
        source: "manual"
      },
    });
  };

  const islLocationUptodate = () => {
    if (!settings?.location) {
      return false;
    }

    const { resolvedAt, lat, lng, source } = settings?.location as LocationSetting;
    let hasLocation = resolvedAt > 0 && !!lat && !!lng;
    // We do not re-prompt location picker if user was manually select location
    if (hasLocation && (source === "manual")) {
      return true
    }

    let resolvedAnHourAgo = new Date().valueOf() - resolvedAt < 60 * 60 * 1000;
    return hasLocation && resolvedAnHourAgo;
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
      if (!initiated) {
        return;
      }

      if (islLocationUptodate()) {
        return;
      }

      let granted = await requestLocationPermission();
      if (!granted) {
        setIsLocationModalOpen(true);
      }
    })();
  }, [initiated, settings]);

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
