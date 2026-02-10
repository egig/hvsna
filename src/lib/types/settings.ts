import type { Language } from "./language";

export interface GeneralSettings {
  language: Language;
  timezone: string;
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
}

export interface SettingsState {
  settings: GeneralSettings;
  loading: boolean;
  error: string | null;
}

export interface SettingsActions {
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<GeneralSettings>) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export type SettingsStore = SettingsState & SettingsActions;
