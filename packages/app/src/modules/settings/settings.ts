import type { Language } from "../i18n/language";

export interface PrayerTimesFallback {
  fajr: string;
  sunrise: string;
  dzuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface LocationSetting {
  source: "auto" | "manual";
  resolvedAt: number;
  lat: number;
  lng: number;
  name: string;
}

export interface GeneralSettings {
  language: Language;
  timezone: string;
  hijriMonthOffsets?: Partial<Record<number, number>>;
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  reminderMinutesBefore?: number;
  onboardedAt?: number;
  prayerTimesFallback?: PrayerTimesFallback;
  location?: LocationSetting;
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
