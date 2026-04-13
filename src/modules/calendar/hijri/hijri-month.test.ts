import { describe, it, expect, beforeEach } from "vitest";
import { HijriMonth } from "./hijri-month";
import { HijriDate } from "./hijri-date";

describe("HijriMonth", () => {
  describe("constructor", () => {
    it("should create a HijriMonth with given year and month", () => {
      const hijriMonth = new HijriMonth(1445, 1);
      expect(hijriMonth.year).toBe(1445);
      expect(hijriMonth.month).toBe(1);
    });

    it("should create a HijriMonth with valid month conversion", () => {
      const hijriMonth = new HijriMonth(1445, 12);
      expect(hijriMonth.year).toBe(1445);
      expect(hijriMonth.month).toBe(12);
    });
  });

  describe("fromDate", () => {
    it("should create HijriMonth from current Gregorian date when only year provided", () => {
      const currentYear = new Date().getFullYear();
      const hijriDate = HijriDate.fromDate(new Date(currentYear, 0, 1));
      const hijriMonth = new HijriMonth(hijriDate.year, hijriDate.month);
      expect(hijriMonth.year).toBeGreaterThan(1400);
      expect(hijriMonth.month).toBeGreaterThanOrEqual(1);
      expect(hijriMonth.month).toBeLessThanOrEqual(12);
    });

    it("should create HijriMonth from specific Gregorian date", () => {
      // Known conversion: July 6, 2023 corresponds to 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(new Date(2023, 6, 6));
      const hijriMonth = new HijriMonth(hijriDate.year, hijriDate.month);
      expect(hijriMonth.year).toBe(1444);
      expect(hijriMonth.month).toBe(12);
    });

    it("should handle different Gregorian dates correctly", () => {
      const testCases = [
        {
          gregorian: { year: 2023, month: 7, day: 6 },
          expected: { year: 1444, month: 12 },
        },
        {
          gregorian: { year: 2024, month: 1, day: 1 },
          expected: { year: 1445, month: 6 },
        },
      ];

      testCases.forEach(({ gregorian, expected }) => {
        const hijriDate = HijriDate.fromDate(
          new Date(gregorian.year, gregorian.month - 1, gregorian.day)
        );
        const hijriMonth = new HijriMonth(hijriDate.year, hijriDate.month);
        expect(hijriMonth.year).toBe(expected.year);
        expect(hijriMonth.month).toBe(expected.month);
      });
    });
  });

  describe("previous", () => {
    it("should return the previous Hijri month", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      const previousMonth = hijriMonth.previous();

      expect(previousMonth.year).toBe(1445);
      expect(previousMonth.month).toBe(5); // Corrected: 6 - 1 = 5
    });

    it("should handle year boundaries correctly", () => {
      const hijriMonth = new HijriMonth(1445, 1);
      const previousMonth = hijriMonth.previous();

      expect(previousMonth.year).toBe(1444);
      expect(previousMonth.month).toBe(12);
    });

    it("should return a new HijriMonth instance", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      const previousMonth = hijriMonth.previous();

      expect(previousMonth).not.toBe(hijriMonth);
      expect(hijriMonth.month).toBe(6); // Original should remain unchanged
    });
  });

  describe("next", () => {
    it("should return the next Hijri month", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      const nextMonth = hijriMonth.next();

      expect(nextMonth.year).toBe(1445);
      expect(nextMonth.month).toBe(7);
    });

    it("should handle year boundaries correctly", () => {
      const hijriMonth = new HijriMonth(1445, 12);
      const nextMonth = hijriMonth.next();

      expect(nextMonth.year).toBe(1446);
      expect(nextMonth.month).toBe(1);
    });

    it("should return a new HijriMonth instance", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      const nextMonth = hijriMonth.next();

      expect(nextMonth).not.toBe(hijriMonth);
      expect(hijriMonth.month).toBe(6); // Original should remain unchanged
    });
  });

  describe("getDaysInMonth", () => {
    it("should return correct number of days for different months", () => {
      const testMonths = [
        { year: 1445, month: 1 }, // Muharram
        { year: 1445, month: 2 }, // Safar
        { year: 1445, month: 9 }, // Ramadan
        { year: 1445, month: 12 }, // Dhu al-Hijjah
      ];

      testMonths.forEach(({ year, month }) => {
        const hijriMonth = new HijriMonth(year, month);
        const daysInMonth = hijriMonth.getDaysInMonth();
        expect(daysInMonth).toBeGreaterThanOrEqual(29);
        expect(daysInMonth).toBeLessThanOrEqual(30);
      });
    });

    it("should return valid day count for all months", () => {
      for (let month = 1; month <= 12; month++) {
        const hijriMonth = new HijriMonth(1445, month);
        const daysInMonth = hijriMonth.getDaysInMonth();
        expect(daysInMonth).toBeGreaterThanOrEqual(29);
        expect(daysInMonth).toBeLessThanOrEqual(30);
      }
    });
  });

  describe("getFirstDay", () => {
    it("should return HijriDate for the first day of the month", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      const firstDay = hijriMonth.getFirstDay();

      expect(firstDay).toBeInstanceOf(HijriDate);
      expect(firstDay.year).toBe(1445);
      expect(firstDay.month).toBe(6);
      expect(firstDay.day).toBe(1);
    });
  });

  describe("getLastDay", () => {
    it("should return HijriDate for the last day of the month", () => {
      const hijriMonth = new HijriMonth(1445, 1);
      const lastDay = hijriMonth.getLastDay();

      expect(lastDay).toBeInstanceOf(HijriDate);
      expect(lastDay.year).toBe(1445);
      expect(lastDay.month).toBe(1);
      expect(lastDay.day).toBeGreaterThanOrEqual(29);
      expect(lastDay.day).toBeLessThanOrEqual(30);
    });

    it("should return correct last day for different months", () => {
      const hijriMonth = new HijriMonth(1445, 2);
      const lastDay = hijriMonth.getLastDay();

      expect(lastDay.year).toBe(1445);
      expect(lastDay.month).toBe(2);
      expect(lastDay.day).toBeGreaterThanOrEqual(29);
      expect(lastDay.day).toBeLessThanOrEqual(30);
    });
  });

  describe("toString", () => {
    it("should return string representation in YYYY-MM format", () => {
      const hijriMonth = new HijriMonth(1445, 6);
      expect(hijriMonth.toString()).toBe("1445-06");
    });

    it("should pad single digit month with zero", () => {
      const hijriMonth = new HijriMonth(1445, 1);
      expect(hijriMonth.toString()).toBe("1445-01");
    });

    it("should handle double digit month without padding", () => {
      const hijriMonth = new HijriMonth(1445, 12);
      expect(hijriMonth.toString()).toBe("1445-12");
    });
  });

  describe("equals", () => {
    it("should return true for equal months", () => {
      const month1 = new HijriMonth(1445, 6);
      const month2 = new HijriMonth(1445, 6);
      expect(month1.equals(month2)).toBe(true);
    });

    it("should return false for different months", () => {
      const month1 = new HijriMonth(1445, 6);
      const month2 = new HijriMonth(1445, 7);
      expect(month1.equals(month2)).toBe(false);
    });

    it("should return false for different years", () => {
      const month1 = new HijriMonth(1445, 6);
      const month2 = new HijriMonth(1446, 6);
      expect(month1.equals(month2)).toBe(false);
    });

    it("should return false for different years and months", () => {
      const month1 = new HijriMonth(1445, 6);
      const month2 = new HijriMonth(1446, 7);
      expect(month1.equals(month2)).toBe(false);
    });
  });

  describe("month arithmetic consistency", () => {
    it("should maintain consistency when going forward and backward", () => {
      const originalMonth = new HijriMonth(1445, 6);
      const nextMonth = originalMonth.next();
      const backToOriginal = nextMonth.previous();

      expect(backToOriginal.year).toBe(originalMonth.year);
      expect(backToOriginal.month).toBe(originalMonth.month);
    });

    it("should handle multiple consecutive operations", () => {
      const startMonth = new HijriMonth(1445, 1);

      // Go forward 6 months
      let currentMonth = startMonth;
      for (let i = 0; i < 6; i++) {
        currentMonth = currentMonth.next();
      }

      expect(currentMonth.year).toBe(1445);
      expect(currentMonth.month).toBe(7);

      // Go backward 6 months
      for (let i = 0; i < 6; i++) {
        currentMonth = currentMonth.previous();
      }

      expect(currentMonth.year).toBe(1445);
      expect(currentMonth.month).toBe(1); // Should return to original
    });

    it("should handle year transitions correctly", () => {
      const startMonth = new HijriMonth(1445, 11);

      // Go forward 3 months (should cross year boundary)
      let currentMonth = startMonth;
      for (let i = 0; i < 3; i++) {
        currentMonth = currentMonth.next();
      }

      expect(currentMonth.year).toBe(1446);
      expect(currentMonth.month).toBe(2);

      // Go backward 3 months (should return to original)
      for (let i = 0; i < 3; i++) {
        currentMonth = currentMonth.previous();
      }

      expect(currentMonth.year).toBe(1445);
      expect(currentMonth.month).toBe(11); // Should return to original
    });
  });

  describe("latitude, longitude, and offset support", () => {
    it("should store latitude, longitude, and offset in constructor", () => {
      const hijriMonth = new HijriMonth(1445, 6, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });
      expect(hijriMonth._latitude).toBe(21.4225);
      expect(hijriMonth._longitude).toBe(39.8262);
      expect(hijriMonth._offset).toBe(1);
    });

    it("should handle undefined latitude, longitude, and offset", () => {
      const hijriMonth = new HijriMonth(1445, 6, {});
      expect(hijriMonth._latitude).toBeUndefined();
      expect(hijriMonth._longitude).toBeUndefined();
      expect(hijriMonth._offset).toBeUndefined();
    });

    it("should preserve location and offset in previous() method", () => {
      const hijriMonth = new HijriMonth(1445, 6, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });
      const previousMonth = hijriMonth.previous();

      expect(previousMonth._latitude).toBe(21.4225);
      expect(previousMonth._longitude).toBe(39.8262);
      expect(previousMonth._offset).toBe(1);
    });

    it("should preserve location and offset in next() method", () => {
      const hijriMonth = new HijriMonth(1445, 6, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });
      const nextMonth = hijriMonth.next();

      expect(nextMonth._latitude).toBe(21.4225);
      expect(nextMonth._longitude).toBe(39.8262);
      expect(nextMonth._offset).toBe(1);
    });

    it("should pass location and offset to HijriDate in getFirstDay()", () => {
      const hijriMonth = new HijriMonth(1445, 6, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });
      const firstDay = hijriMonth.getFirstDay();

      expect(firstDay._latitude).toBe(21.4225);
      expect(firstDay._longitude).toBe(39.8262);
      expect(firstDay._offset).toBe(1);
    });

    it("should pass location and offset to HijriDate in getLastDay()", () => {
      const hijriMonth = new HijriMonth(1445, 6, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });
      const lastDay = hijriMonth.getLastDay();

      expect(lastDay._latitude).toBe(21.4225);
      expect(lastDay._longitude).toBe(39.8262);
      expect(lastDay._offset).toBe(1);
    });
  });

  describe("static fromDate", () => {
    it("should create HijriMonth from Date with location and offset", () => {
      const date = new Date(2023, 6, 6); // July 6, 2023
      const hijriMonth = HijriMonth.fromDate(date, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });

      expect(hijriMonth).toBeInstanceOf(HijriMonth);
      expect(hijriMonth._latitude).toBe(21.4225);
      expect(hijriMonth._longitude).toBe(39.8262);
      expect(hijriMonth._offset).toBe(1);
    });

    it("should use default location when not provided", () => {
      const date = new Date(2023, 6, 6);
      const hijriMonth = HijriMonth.fromDate(date);

      expect(hijriMonth._latitude).toBe(-6.2088); // Jakarta default
      expect(hijriMonth._longitude).toBe(106.8456); // Jakarta default
      expect(hijriMonth._offset).toBe(0);
    });

    it("should use default offset when not provided", () => {
      const date = new Date(2023, 6, 6);
      const hijriMonth = HijriMonth.fromDate(date, {
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 0,
      });

      expect(hijriMonth._latitude).toBe(21.4225);
      expect(hijriMonth._longitude).toBe(39.8262);
      expect(hijriMonth._offset).toBe(0);
    });
  });

  describe("static getCurrent", () => {
    it("should create current HijriMonth with location and offset", () => {
      const hijriMonth = HijriMonth.getCurrent({
        latitude: 21.4225,
        longitude: 39.8262,
        offset: 1,
      });

      expect(hijriMonth).toBeInstanceOf(HijriMonth);
      expect(hijriMonth._latitude).toBe(21.4225);
      expect(hijriMonth._longitude).toBe(39.8262);
      expect(hijriMonth._offset).toBe(1);
      expect(hijriMonth.year).toBeGreaterThan(1400);
      expect(hijriMonth.month).toBeGreaterThanOrEqual(1);
      expect(hijriMonth.month).toBeLessThanOrEqual(12);
    });

    it("should use default location and offset when not provided", () => {
      const hijriMonth = HijriMonth.getCurrent();

      expect(hijriMonth._latitude).toBe(-6.2088); // Jakarta default
      expect(hijriMonth._longitude).toBe(106.8456); // Jakarta default
      expect(hijriMonth._offset).toBe(0);
    });
  });
});
