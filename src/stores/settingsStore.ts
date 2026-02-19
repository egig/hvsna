import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GeneralSettings } from "../lib/types/settings";
import type { Language } from "../lib/types/language";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  manualDateOffset: 0,
  theme: "system",
  notifications: true,
};

interface SettingsState {
  settings: GeneralSettings;
  loading: boolean;
  error: string | null;
  initiated: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  setInitiated: (i: boolean) => void;
  setError: (error: string | null) => void;
  setSettings: (settings: GeneralSettings) => void;
  updateSettings: (updates: Partial<GeneralSettings>) => void;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      loading: false,
      error: null,
      initiated: false,

      setLoading: (loading) => set({ loading }, false, "setLoading"),
      setInitiated: (initiated) => set({ initiated}, false, "setInitiated"),

      setError: (error) => set({ error }, false, "setError"),

      setSettings: (settings) => set({ settings }, false, "setSettings"),

      updateSettings: (updates) =>
        set(
          (state) => ({
            settings: { ...state.settings, ...updates },
          }),
          false,
          "updateSettings",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    {
      name: "settings-store",
    },
  ),
);
