import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GeneralSettings, Language } from "../lib/types/settings";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  theme: "system",
  notifications: true,
};

interface SettingsState {
  settings: GeneralSettings;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
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

      setLoading: (loading) => set({ loading }, false, "setLoading"),

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
