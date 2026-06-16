import type { GeneralSettings, PrayerTimesFallback } from "./settings";

export const DEFAULT_PRAYER_TIMES: PrayerTimesFallback = {
  fajr: "05:00",
  sunrise: "06:00",
  dzuhr: "12:00",
  asr: "15:00",
  maghrib: "18:00",
  isha: "19:00",
};

export const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: "",
  theme: "system",
  notifications: true,
  reminderMinutesBefore: 15,
  prayerTimesFallback: DEFAULT_PRAYER_TIMES,
};

/** Merge persisted settings over the defaults, falling back to defaults when absent. */
export function withDefaults(saved: GeneralSettings | null): GeneralSettings {
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
}
