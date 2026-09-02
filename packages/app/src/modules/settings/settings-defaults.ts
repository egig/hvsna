import type { GeneralSettings } from "./settings";
import {
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_MADHAB,
} from "../prayer-calculation";

export const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: "",
  theme: "system",
  notifications: true,
  reminderMinutesBefore: 15,
  calculationMethod: DEFAULT_CALCULATION_METHOD,
  madhab: DEFAULT_MADHAB,
};

/** Merge persisted settings over the defaults, falling back to defaults when absent. */
export function withDefaults(saved: GeneralSettings | null): GeneralSettings {
  return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
}
