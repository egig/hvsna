import { useCallback, useEffect } from "react";
import { useSettingsStore } from "./settingsStore";
import type {
  GeneralSettings,
  Coordinate,
  LocationResolveType,
} from "./settings";
import { usePouchDB } from "../../pouchdb";
import type { Language } from "../i18n/language";
import { CapacitorGeolocation } from "../../lib/capacitor";

const SETTINGS_DOC_ID = "general_settings";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: "system",
  notifications: true,
  locationResolvedAt: undefined,
  locationResolveType: undefined,
  coordinate: undefined,
};

export function useSettings() {
  const { db } = usePouchDB();
  const {
    settings,
    loading,
    error,
    setLoading,
    setError,
    setSettings,
    updateSettings: updateSettingsInStore,
    clearError,
    initiated,
    setInitiated,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      try {
        const doc = (await db.get(SETTINGS_DOC_ID)) as any;

        if (doc && doc.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...doc.settings });
        }
      } catch (err: any) {
        // If document doesn't exist, use default settings
        if (err.status !== 404) {
          throw err;
        }
      }
    } catch (error: any) {
      setError(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
      setInitiated(true);
    }
  }, [db, setLoading, clearError, setSettings, setError]);

  const updateSettings = useCallback(
    async (updates: Partial<GeneralSettings>): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const currentSettings = settings;
        const newSettings = { ...currentSettings, ...updates };

        // Save to PouchDB
        const now = new Date().toISOString();

        try {
          const existingDoc = (await db.get(SETTINGS_DOC_ID)) as any;
          await db.put({
            ...existingDoc,
            settings: newSettings,
            updated_at: now,
          });
        } catch (err: any) {
          if (err.status === 404) {
            await db.put({
              _id: SETTINGS_DOC_ID,
              settings: newSettings,
              created_at: now,
              updated_at: now,
            });
          } else {
            throw err;
          }
        }

        updateSettingsInStore(updates);
      } catch (error: any) {
        setError(error.message || "Failed to update settings");
      } finally {
        setLoading(false);
      }
    },
    [db, settings, setLoading, clearError, updateSettingsInStore, setError],
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 0,
          });
        },
      );

      const coordinate: Coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      };

      await updateSettings({
        coordinate,
        locationResolvedAt: new Date().toISOString(),
        locationResolveType: "auto",
      });

      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied by user");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable");
            break;
          case err.TIMEOUT:
            setError("Location request timed out");
            break;
          default:
            setError("Unknown error occurred while getting location");
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to get location permission",
        );
      }
      return false;
    }
  }, [updateSettings, setLoading, setError]);

  const getCurrentLocation =
    useCallback(async (): Promise<Coordinate | null> => {
      if (!("geolocation" in navigator)) {
        setError("Geolocation is not supported by this browser");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            });
          },
        );

        const coordinate: Coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };

        setLoading(false);
        return coordinate;
      } catch (err) {
        setLoading(false);
        if (err instanceof GeolocationPositionError) {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setError("Location permission denied by user");
              break;
            case err.POSITION_UNAVAILABLE:
              setError("Location information is unavailable");
              break;
            case err.TIMEOUT:
              setError("Location request timed out");
              break;
            default:
              setError("Unknown error occurred while getting location");
          }
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to get current location",
          );
        }
        return null;
      }
    }, [setLoading, setError]);

  const updateLocation = useCallback(
    async (
      coordinate: Coordinate,
      resolveType: LocationResolveType,
    ): Promise<void> => {
      await updateSettings({
        coordinate,
        locationResolvedAt: new Date().toISOString(),
        locationResolveType: resolveType,
      });
    },
    [updateSettings],
  );

  const setManualLocation = useCallback(
    async (latitude: number, longitude: number): Promise<void> => {
      const coordinate: Coordinate = {
        latitude,
        longitude,
        accuracy: undefined,
      };

      await updateSettings({
        coordinate,
        locationResolvedAt: new Date().toISOString(),
        locationResolveType: "manual",
      });
    },
    [updateSettings],
  );

  const clearLocation = useCallback(async (): Promise<void> => {
    await updateSettings({
      coordinate: undefined,
      locationResolvedAt: undefined,
      locationResolveType: undefined,
    });
  }, [updateSettings]);

  // Capacitor-specific location functions
  const requestNativeLocationPermission =
    useCallback(async (): Promise<boolean> => {
      if (!CapacitorGeolocation.isNativePlatform()) {
        setError(
          "Native location services are only available on mobile devices",
        );
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const permissionResult = await CapacitorGeolocation.checkPermissions();

        if (permissionResult.state === "granted") {
          setLoading(false);
          return true;
        }

        if (permissionResult.state === "denied") {
          setError(
            "Location permission denied. Please enable in device settings.",
          );
          setLoading(false);
          return false;
        }

        // Request permission
        const requestResult = await CapacitorGeolocation.requestPermissions();

        if (requestResult.state === "granted") {
          setLoading(false);
          return true;
        } else {
          setError(requestResult.message || "Location permission denied");
          setLoading(false);
          return false;
        }
      } catch (err) {
        setLoading(false);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to request native location permission",
        );
        return false;
      }
    }, [setLoading, setError]);

  const getCurrentNativeLocation =
    useCallback(async (): Promise<Coordinate | null> => {
      if (!CapacitorGeolocation.isNativePlatform()) {
        setError(
          "Native location services are only available on mobile devices",
        );
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const position = await CapacitorGeolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000, // 5 minutes
        });

        const coordinate: Coordinate = {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          altitude: position.altitude,
          altitudeAccuracy: position.altitudeAccuracy,
          heading: position.heading,
          speed: position.speed,
        };

        setLoading(false);
        return coordinate;
      } catch (err) {
        setLoading(false);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to get current native location",
        );
        return null;
      }
    }, [setLoading, setError]);

  const requestNativeLocationAndUpdate =
    useCallback(async (): Promise<boolean> => {
      // First check/request permissions
      const hasPermission = await requestNativeLocationPermission();
      if (!hasPermission) {
        return false;
      }

      // Get current location
      const coordinate = await getCurrentNativeLocation();
      if (!coordinate) {
        return false;
      }

      // Update settings
      await updateSettings({
        coordinate,
        locationResolvedAt: new Date().toISOString(),
        locationResolveType: "capacitor_native",
      });

      return true;
    }, [
      requestNativeLocationPermission,
      getCurrentNativeLocation,
      updateSettings,
    ]);

  // Enhanced getCurrentLocation that tries Capacitor first on native platforms
  const getBestCurrentLocation =
    useCallback(async (): Promise<Coordinate | null> => {
      if (CapacitorGeolocation.isNativePlatform()) {
        // Try native location first
        const nativeLocation = await getCurrentNativeLocation();
        if (nativeLocation) {
          return nativeLocation;
        }

        // Fallback to browser if native fails
        setError("Native location failed, trying browser location...");
      }

      // Use browser location as fallback
      return getCurrentLocation();
    }, [getCurrentNativeLocation, getCurrentLocation, setError]);

  // Enhanced request permission that works on both platforms
  const requestBestLocationPermission =
    useCallback(async (): Promise<boolean> => {
      if (CapacitorGeolocation.isNativePlatform()) {
        return requestNativeLocationPermission();
      }

      // Use browser permission request
      return requestLocationPermission();
    }, [requestNativeLocationPermission, requestLocationPermission]);

  const hasLocationPermission = !!(
    settings.coordinate &&
    settings.locationResolvedAt &&
    settings.locationResolveType
  );

  // Function to get timezone from coordinates
  const getTimezoneFromCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      try {
        // Use the TimeAPI.io to get timezone from coordinates
        const response = await fetch(
          `https://timeapi.io/api/Time/current/coordinate?latitude=${latitude}&longitude=${longitude}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch timezone data");
        }

        const data = await response.json();

        if (data && data.timezone) {
          return data.timezone;
        }

        // Fallback to a basic timezone estimation based on longitude
        const timezoneOffset = Math.round(longitude / 15);
        const offsetHours =
          timezoneOffset >= 0 ? timezoneOffset : timezoneOffset - 1;
        const gmtString =
          offsetHours >= 0 ? `GMT+${offsetHours}` : `GMT${offsetHours}`;

        // Map common GMT offsets to timezone names
        const timezoneMap: { [key: string]: string } = {
          "GMT+0": "Europe/London",
          "GMT+1": "Europe/Paris",
          "GMT+2": "Europe/Cairo",
          "GMT+3": "Europe/Moscow",
          "GMT+4": "Asia/Dubai",
          "GMT+5": "Asia/Karachi",
          "GMT+6": "Asia/Dhaka",
          "GMT+7": "Asia/Jakarta",
          "GMT+8": "Asia/Shanghai",
          "GMT+9": "Asia/Tokyo",
          "GMT+10": "Australia/Sydney",
          "GMT+11": "Pacific/Noumea",
          "GMT+12": "Pacific/Auckland",
          "GMT-1": "Atlantic/Azores",
          "GMT-2": "Atlantic/South_Georgia",
          "GMT-3": "America/Sao_Paulo",
          "GMT-4": "America/New_York",
          "GMT-5": "America/Chicago",
          "GMT-6": "America/Denver",
          "GMT-7": "America/Los_Angeles",
          "GMT-8": "America/Anchorage",
          "GMT-9": "Pacific/Gambier",
          "GMT-10": "Pacific/Honolulu",
          "GMT-11": "Pacific/Midway",
          "GMT-12": "Pacific/Kiritimati",
        };

        return timezoneMap[gmtString] || gmtString;
      } catch (error) {
        console.error("Error getting timezone from coordinates:", error);
        return null;
      }
    },
    [],
  );

  // Function to update timezone based on current location
  const updateTimezoneFromLocation = useCallback(async (): Promise<boolean> => {
    if (!settings.coordinate) {
      setError("No location coordinates available");
      return false;
    }

    try {
      const timezone = await getTimezoneFromCoordinates(
        settings.coordinate.latitude,
        settings.coordinate.longitude,
      );

      if (timezone) {
        await updateSettings({ timezone });
        return true;
      } else {
        setError("Could not determine timezone from location");
        return false;
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update timezone from location",
      );
      return false;
    }
  }, [
    settings.coordinate,
    getTimezoneFromCoordinates,
    updateSettings,
    setError,
  ]);

  const setLanguage = useCallback(
    async (language: Language): Promise<void> => {
      await updateSettings({ language });
    },
    [updateSettings],
  );

  const resetSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      // Save to PouchDB
      const now = new Date().toISOString();

      try {
        const existingDoc = (await db.get(SETTINGS_DOC_ID)) as any;
        await db.put({
          ...existingDoc,
          settings: DEFAULT_SETTINGS,
          updated_at: now,
        });
      } catch (err: any) {
        if (err.status === 404) {
          await db.put({
            _id: SETTINGS_DOC_ID,
            settings: DEFAULT_SETTINGS,
            created_at: now,
            updated_at: now,
          });
        } else {
          throw err;
        }
      }

      setSettings(DEFAULT_SETTINGS);
    } catch (error: any) {
      setError(error.message || "Failed to reset settings");
    } finally {
      setLoading(false);
    }
  }, [db, setLoading, clearError, setSettings, setError]);

  return {
    settings,
    loading,
    initiated,
    error,
    loadSettings,
    updateSettings,
    setLanguage,
    resetSettings,
    // Location functions
    requestLocationPermission,
    getCurrentLocation,
    updateLocation,
    setManualLocation,
    clearLocation,
    hasLocationPermission,
    // Enhanced Capacitor location functions
    requestNativeLocationPermission,
    getCurrentNativeLocation,
    requestNativeLocationAndUpdate,
    getBestCurrentLocation,
    requestBestLocationPermission,
    // Timezone functions
    getTimezoneFromCoordinates,
    updateTimezoneFromLocation,
  };
}
