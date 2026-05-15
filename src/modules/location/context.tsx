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
import { TimezonePickerModal } from "../components/timezone-picker-modal";
import { useSettings } from "../settings";

interface LocationContextType {
  name: string;
  lat: number;
  lng: number;
  timezone: string;
  error: string;
  requestLocationPermission: Function;
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
  const [name, setName] = useState("");
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [error, setError] = useState("");
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const { updateSettings, settings, initiated } = useSettings();

  const useCases = new LocationUseCases(
    createLocationProvider(),
    new TimeAPITimezoneProvider()
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError("");
      const coordinate = await useCases.requestLocation({
        timeout: 5000,
        maximumAge: 0,
      });

      setLat(coordinate.latitude);
      setLng(coordinate.longitude);

      // TODO get place name, set timezone as fallback
      const t = await useCases.getTimezoneFromCoordinates(
        coordinate.latitude,
        coordinate.longitude
      );
      setName(t as string);

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get location permission"
      );
      return false;
    } finally {
    }
  }, []);

  const handleSelectTimezone = (timezone: string) => {
    updateSettings({
      timezone,
    });
  };

  useEffect(() => {
    (async () => {
      let granted = await requestLocationPermission();
      if (!granted) {
        setIsTimezoneModalOpen(true);
      }
    })();
  }, []);

  return (
    <LacationContext.Provider
      value={{
        name,
        lat,
        lng,
        timezone: settings.timezone,
        error,
        requestLocationPermission,
      }}
    >
      {children}

      <TimezonePickerModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
        value={settings.timezone}
        onSelect={handleSelectTimezone}
        title={"Select Timezone"}
        data-testid="timezone-modal"
        dismissable={false}
      />
    </LacationContext.Provider>
  );
};
