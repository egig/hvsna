import { useCallback, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import type { GeneralSettings } from "../lib/types/settings";
import type { Language } from "../lib/types/language";
import { usePouchDB } from "../pouchdb";

const SETTINGS_DOC_ID = "general_settings";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: "system",
  notifications: true,
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
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      // Try to load from PouchDB first
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
    error,
    loadSettings,
    updateSettings,
    setLanguage,
    resetSettings,
  };
}
