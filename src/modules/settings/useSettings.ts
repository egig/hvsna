import { useCallback, useEffect } from "react";
import { useSettingsStore } from "./settingsStore";
import type {
  GeneralSettings,
} from "./settings";
import { usePouchDB } from "../../pouchdb";
import type { Language } from "../i18n/language";
import { createSettingsUseCases } from "../../infra/settings/SettingsUseCasesFactory";
import type { GeolocationOptions } from "../../domain/settings/ILocationProvider";
import { clearPrayerTimesCache } from "../task/prayer-time-service";

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
    [db, settings]
  );

  const setLanguage = useCallback(
    async (language: Language): Promise<void> => {
      await updateSettings({ language });
    },
    [updateSettings]
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

  return {
    settings,
    loading,
    initiated,
    error,
    loadSettings,
    updateSettings,
    setLanguage,
    resetSettings,
  };
}
