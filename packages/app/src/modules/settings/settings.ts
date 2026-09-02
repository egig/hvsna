import type { Language } from "../i18n/language";
import type {
  PrayerCalculationMethod,
  PrayerMadhab,
} from "../prayer-calculation";

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
  location?: LocationSetting;
  /** Prayer-time calculation method — kept string-identical to the Android app. */
  calculationMethod?: PrayerCalculationMethod;
  /** Madhab for Asr calculation (Hanafi = longer shadow). */
  madhab?: PrayerMadhab;
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
