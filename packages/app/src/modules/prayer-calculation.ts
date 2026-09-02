import { CalculationMethod, Madhab } from "adhan";
import type { CalculationParameters } from "adhan";

/**
 * Prayer-time calculation settings, kept string-identical to the native Android
 * app (`android/.../PrayerTimesRepository.kt` + `SettingsPrayerTimeScreen.kt`) so
 * the two platforms stay in sync and a value can round-trip through sync one day.
 * The `adhan` npm package names methods differently (`MoonsightingCommittee` vs
 * Android's `MOON_SIGHTING_COMMITTEE`), so we map here; `KEMENAG` isn't in `adhan`
 * at all and is assembled by hand (see `kemenagParameters`).
 */
export const PRAYER_CALCULATION_METHODS = [
  "KEMENAG",
  "MUSLIM_WORLD_LEAGUE",
  "EGYPTIAN",
  "KARACHI",
  "UMM_AL_QURA",
  "DUBAI",
  "MOON_SIGHTING_COMMITTEE",
  "NORTH_AMERICA",
  "KUWAIT",
  "QATAR",
  "SINGAPORE",
  "TURKEY",
  "TEHRAN",
  "OTHER",
] as const;

export type PrayerCalculationMethod = (typeof PRAYER_CALCULATION_METHODS)[number];

export const PRAYER_MADHABS = ["SHAFI", "HANAFI"] as const;

export type PrayerMadhab = (typeof PRAYER_MADHABS)[number];

/** Android's defaults (`AppSettings.kt`). */
export const DEFAULT_CALCULATION_METHOD: PrayerCalculationMethod =
  "MOON_SIGHTING_COMMITTEE";
export const DEFAULT_MADHAB: PrayerMadhab = "SHAFI";

/**
 * KEMENAG (Kementerian Agama RI) — the official Indonesian method. It is not
 * built into `adhan`, so we assemble it: sun 20° below the horizon for Fajr and
 * 18° for Isha (Aladhan calls this "method 20"), plus the Kemenag *ihtiyati*
 * (safety) margin of +2 minutes on every prayer and −2 minutes on sunrise, which
 * is what brings the result in line with the printed Kemenag / Bimas Islam
 * schedules. Kept identical to Android's `PrayerTimesRepository.kt`.
 */
function kemenagParameters(): CalculationParameters {
  const params = CalculationMethod.Other();
  params.fajrAngle = 20;
  params.ishaAngle = 18;
  params.adjustments = {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };
  return params;
}

const METHOD_FACTORIES: Record<
  PrayerCalculationMethod,
  () => CalculationParameters
> = {
  KEMENAG: kemenagParameters,
  MUSLIM_WORLD_LEAGUE: CalculationMethod.MuslimWorldLeague,
  EGYPTIAN: CalculationMethod.Egyptian,
  KARACHI: CalculationMethod.Karachi,
  UMM_AL_QURA: CalculationMethod.UmmAlQura,
  DUBAI: CalculationMethod.Dubai,
  MOON_SIGHTING_COMMITTEE: CalculationMethod.MoonsightingCommittee,
  NORTH_AMERICA: CalculationMethod.NorthAmerica,
  KUWAIT: CalculationMethod.Kuwait,
  QATAR: CalculationMethod.Qatar,
  SINGAPORE: CalculationMethod.Singapore,
  TURKEY: CalculationMethod.Turkey,
  TEHRAN: CalculationMethod.Tehran,
  OTHER: CalculationMethod.Other,
};

/**
 * Builds `adhan` calculation parameters from the persisted settings, falling
 * back to the Android defaults for unset or unrecognized values. The `madhab`
 * only affects the Asr time (Hanafi = longer shadow).
 */
export function buildCalculationParameters(
  method: PrayerCalculationMethod | undefined,
  madhab: PrayerMadhab | undefined
): CalculationParameters {
  const factory =
    METHOD_FACTORIES[method as PrayerCalculationMethod] ??
    METHOD_FACTORIES[DEFAULT_CALCULATION_METHOD];
  const params = factory();
  params.madhab = madhab === "HANAFI" ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}
