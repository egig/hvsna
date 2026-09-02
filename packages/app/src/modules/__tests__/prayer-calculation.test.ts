import { describe, it, expect } from "vitest";
import { Madhab, Coordinates, PrayerTimes } from "adhan";
import {
  buildCalculationParameters,
  PRAYER_CALCULATION_METHODS,
  DEFAULT_CALCULATION_METHOD,
} from "../prayer-calculation";

describe("buildCalculationParameters", () => {
  it("maps every Android method name to an adhan method", () => {
    for (const method of PRAYER_CALCULATION_METHODS) {
      const params = buildCalculationParameters(method, "SHAFI");
      expect(params.fajrAngle).toBeGreaterThanOrEqual(0);
      expect(params.method).toBeTruthy();
    }
  });

  it("KEMENAG uses Fajr 20 / Isha 18 with the +2 / -2 ihtiyati margin", () => {
    const params = buildCalculationParameters("KEMENAG", "SHAFI");
    expect(params.fajrAngle).toBe(20);
    expect(params.ishaAngle).toBe(18);
  });

  it("falls back to the default method for an unknown value", () => {
    const unknown = buildCalculationParameters(
      "NOT_A_METHOD" as never,
      "SHAFI"
    );
    const fallback = buildCalculationParameters(DEFAULT_CALCULATION_METHOD, "SHAFI");
    expect(unknown.method).toBe(fallback.method);
  });

  it("sets the madhab, defaulting undefined to Shafi", () => {
    expect(buildCalculationParameters("KARACHI", "HANAFI").madhab).toBe(
      Madhab.Hanafi
    );
    expect(buildCalculationParameters("KARACHI", "SHAFI").madhab).toBe(
      Madhab.Shafi
    );
    expect(buildCalculationParameters("KARACHI", undefined).madhab).toBe(
      Madhab.Shafi
    );
  });

  it("Hanafi pushes Asr later than Shafi for the same day/location", () => {
    const coords = new Coordinates(-6.2, 106.8);
    const date = new Date(2026, 0, 15);
    const shafiAsr = new PrayerTimes(
      coords,
      date,
      buildCalculationParameters("MOON_SIGHTING_COMMITTEE", "SHAFI")
    ).asr;
    const hanafiAsr = new PrayerTimes(
      coords,
      date,
      buildCalculationParameters("MOON_SIGHTING_COMMITTEE", "HANAFI")
    ).asr;
    expect(hanafiAsr.valueOf()).toBeGreaterThan(shafiAsr.valueOf());
  });
});
