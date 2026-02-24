import type { Language } from "../i18n/language";

export interface Coordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export type LocationResolveType = "manual" | "auto" | "capacitor_native";

export interface GeneralSettings {
  language: Language;
  timezone: string;
  manualDateOffset?: number;
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  locationResolvedAt?: string;
  locationResolveType?: LocationResolveType;
  coordinate?: Coordinate | null;
  onboardedAt?: number;
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
