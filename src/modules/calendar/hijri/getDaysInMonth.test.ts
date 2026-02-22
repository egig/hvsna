import { describe, it, expect } from "vitest";
import { HijriDate } from "./hijri-date";
import { HijriMonth } from "./hijri-month";

describe("HijriDate.getDaysInMonth", () => {
  it("should return 29 or 30 days for different months", () => {
    const testMonths = [
      { year: 1445, month: 1 }, // Muharram
      { year: 1445, month: 2 }, // Safar
      { year: 1445, month: 9 }, // Ramadan
      { year: 1445, month: 12 }, // Dhu al-Hijjah
    ];

    testMonths.forEach(({ year, month }) => {
      const daysInMonth = HijriDate.getDaysInMonth(year, month);
      expect(daysInMonth).toBeGreaterThanOrEqual(29);
      expect(daysInMonth).toBeLessThanOrEqual(30);
    });
  });

  it("should return valid day count for all months", () => {
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = HijriDate.getDaysInMonth(1445, month);
      expect(daysInMonth).toBeGreaterThanOrEqual(29);
      expect(daysInMonth).toBeLessThanOrEqual(30);
    }
  });

  it("should be consistent with HijriMonth.getDaysInMonth", () => {
    // Test a few months to ensure consistency
    const testCases = [
      { year: 1445, month: 1 },
      { year: 1445, month: 6 },
      { year: 1445, month: 12 },
    ];

    testCases.forEach(({ year, month }) => {
      const staticDays = HijriDate.getDaysInMonth(year, month);

      // Create a HijriMonth instance to compare
      const hijriMonth = new HijriMonth(year, month);
      const instanceDays = hijriMonth.getDaysInMonth();

      expect(staticDays).toBe(instanceDays);
    });
  });
});
