import { useCallback, useEffect } from "react";
import { useSettingsStore } from "./settingsStore";
import type {
  GeneralSettings,
  Coordinate,
  LocationResolveType,
} from "./settings";
import { usePouchDB } from "../../pouchdb";
import type { Language } from "../i18n/language";
import { createSettingsUseCases } from "../../infra/settings/SettingsUseCasesFactory";
import type { GeolocationOptions } from "../../domain/settings/ILocationProvider";

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

  const useCases = createSettingsUseCases(db);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();
    try {
      const loaded = await useCases.loadSettings();
      setSettings(loaded);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
      setInitiated(true);
    }
  }, [db]);

  const updateSettings = useCallback(
    async (updates: Partial<GeneralSettings>): Promise<void> => {
      setLoading(true);
      clearError();
      try {
        await useCases.updateSettings(settings, updates);
        updateSettingsInStore(updates);
      } catch (err: any) {
        setError(err.message || "Failed to update settings");
      } finally {
        setLoading(false);
      }
    },
    [db, settings],
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const coordinate = await useCases.requestLocation({
        timeout: 5000,
        maximumAge: 0,
      });
      await useCases.updateLocation(settings, coordinate, "auto");
      updateSettingsInStore({
        coordinate,
        locationResolvedAt: new Date().toISOString(),
        locationResolveType: "auto",
      });
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get location permission",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [db, settings]);

  const getCurrentLocation = useCallback(
    async (options?: GeolocationOptions): Promise<Coordinate | null> => {
      try {
        setLoading(true);
        setError(null);
        return await useCases.getCurrentPosition(
          options ?? {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          },
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get current location",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

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
      await updateSettings({
        coordinate: { latitude, longitude },
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

  const getTimezoneFromCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      return useCases.getTimezoneFromCoordinates(latitude, longitude);
    },
    [db],
  );

  const updateTimezoneFromLocation = useCallback(async (): Promise<boolean> => {
    try {
      const updated = await useCases.updateTimezoneFromLocation(settings);
      updateSettingsInStore({ timezone: updated.timezone });
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update timezone from location",
      );
      return false;
    }
  }, [db, settings]);

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
      const defaults = await useCases.resetSettings();
      setSettings(defaults);
    } catch (err: any) {
      setError(err.message || "Failed to reset settings");
    } finally {
      setLoading(false);
    }
  }, [db]);

  const hasLocationPermission = !!(
    settings.coordinate &&
    settings.locationResolvedAt &&
    settings.locationResolveType
  );

  return {
    settings,
    loading,
    initiated,
    error,
    loadSettings,
    updateSettings,
    setLanguage,
    resetSettings,
    requestLocationPermission,
    getCurrentLocation,
    updateLocation,
    setManualLocation,
    clearLocation,
    hasLocationPermission,
    getTimezoneFromCoordinates,
    updateTimezoneFromLocation,
  };
}
