import { describe, it, expect, vi, beforeEach } from "vitest";
import { toDate, fromDate } from "./core";
import type { HijriDateComponents, TimeComponents } from "./core";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import * as SunCalc from "suncalc";

// Mock @tabby_ai/hijri-converter
vi.mock("@tabby_ai/hijri-converter", () => ({
  gregorianToHijri: vi.fn(),
  hijriToGregorian: vi.fn(),
}));

// Mock suncalc
vi.mock("suncalc", () => ({
  getTimes: vi.fn(),
}));

describe("core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toDate", () => {
    it("should convert 9 Ramadhan 9am with offset -1 to 27 Feb 9am", () => {
      // @ts-ignore
      vi.mocked(hijriToGregorian).mockImplementation((input) => {
        if (input.year === 1447 && input.month === 9) {
          if (input.day === 9) return { year: 2026, month: 2, day: 26 };
          if (input.day === 10) return { year: 2026, month: 2, day: 27 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 45, 123),
      });

      const hijriDate: HijriDateComponents = { year: 1447, month: 9, day: 9 };
      const hijriTime: TimeComponents = {
        hour: 9,
        minute: 0,
        second: 0,
        millisecond: 0,
      };
      const options = { offset: -1 };

      const result = toDate(hijriDate, hijriTime, options);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-based)
      expect(result.getDate()).toBe(27);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("should convert 9 Ramadhan 8pm with offset -1 to 26 Feb 8pm", () => {
      // @ts-ignore
      vi.mocked(hijriToGregorian).mockImplementation((input) => {
        if (input.year === 1447 && input.month === 9) {
          if (input.day === 9) return { year: 2026, month: 2, day: 26 };
          if (input.day === 10) return { year: 2026, month: 2, day: 27 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 45, 123),
      });

      const hijriDate: HijriDateComponents = { year: 1447, month: 9, day: 9 };
      const hijriTime: TimeComponents = {
        hour: 20,
        minute: 0,
        second: 30,
        millisecond: 500,
      }; // 8:00:30.500 PM
      const options = { offset: -1 };

      const result = toDate(hijriDate, hijriTime, options);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-based)
      expect(result.getDate()).toBe(26); // Previous day due to after sunset
      expect(result.getHours()).toBe(20);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(30);
      expect(result.getMilliseconds()).toBe(500);
    });

    it("should convert 9 Ramadhan without time with offset -1 to 26 Feb sunset time", () => {
      // @ts-ignore
      vi.mocked(hijriToGregorian).mockImplementation((input) => {
        if (input.year === 1447 && input.month === 9) {
          if (input.day === 9) return { year: 2026, month: 2, day: 26 };
          if (input.day === 10) return { year: 2026, month: 2, day: 27 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 45, 123),
      });

      const hijriDate: HijriDateComponents = { year: 1447, month: 9, day: 9 };
      // @ts-ignore
      const hijriTime: TimeComponents = {
        hour: undefined,
        minute: undefined,
        second: undefined,
        millisecond: undefined,
      };
      const options = { offset: -1 };

      const result = toDate(hijriDate, hijriTime, options);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February (0-based)
      expect(result.getDate()).toBe(26); // Previous day due to after sunset
      expect(result.getHours()).toBe(18);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
      expect(result.getMilliseconds()).toBe(123);
    });
  });

  describe("fromDate", () => {
    it("should convert 27 Feb 2026 9am with offset -1 to 9 Ramadhan 1447", () => {
      // @ts-ignore
      vi.mocked(gregorianToHijri).mockImplementation((input) => {
        if (input.year === 2026 && input.month === 2) {
          if (input.day === 26) return { year: 1447, month: 9, day: 9 };
          if (input.day === 27) return { year: 1447, month: 9, day: 10 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 45, 123),
      });

      const options = { offset: -1 };

      const result = fromDate(new Date(2026, 1, 27, 9, 0, 0, 0), options);

      expect(result.year).toBe(1447);
      expect(result.month).toBe(9);
      expect(result.day).toBe(9);
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
      expect(result.second).toBe(0);
      expect(result.millisecond).toBe(0);
    });

    it("should convert 27 Feb 8pm with offset -1 to 10 Ramadhan 1447", () => {
      // @ts-ignore
      vi.mocked(gregorianToHijri).mockImplementation((input) => {
        if (input.year === 2026 && input.month === 2) {
          if (input.day === 26) return { year: 1447, month: 9, day: 9 };
          if (input.day === 27) return { year: 1447, month: 9, day: 10 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 45, 123),
      });

      const options = { offset: -1 };

      const result = fromDate(new Date(2026, 1, 27, 20, 0, 0, 0), options);

      expect(result.year).toBe(1447);
      expect(result.month).toBe(9);
      expect(result.day).toBe(10);
      expect(result.hour).toBe(20);
      expect(result.minute).toBe(0);
      expect(result.second).toBe(0);
      expect(result.millisecond).toBe(0);
    });
  });

  describe("sunset logic", () => {
    it("should handle times exactly at sunset correctly", () => {
      // @ts-ignore
      vi.mocked(gregorianToHijri).mockImplementation((input) => {
        if (input.year === 2026 && input.month === 2) {
          if (input.day === 26) return { year: 1447, month: 9, day: 9 };
          if (input.day === 27) return { year: 1447, month: 9, day: 10 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 26, 18, 30, 45, 123),
      });

      const options = { offset: 0 };

      // Time exactly at sunset should advance to next Hijri day
      const resultAtSunset = fromDate(
        new Date(2026, 1, 26, 18, 30, 45, 123),
        options
      );
      expect(resultAtSunset.year).toBe(1447);
      expect(resultAtSunset.month).toBe(9);
      expect(resultAtSunset.day).toBe(10); // Should be next day

      // Time just before sunset should remain same Hijri day
      const resultBeforeSunset = fromDate(
        new Date(2026, 1, 26, 18, 30, 44, 122),
        options
      );
      expect(resultBeforeSunset.year).toBe(1447);
      expect(resultBeforeSunset.month).toBe(9);
      expect(resultBeforeSunset.day).toBe(9); // Should be same day
    });

    it("should handle times before and after sunset correctly", () => {
      // @ts-ignore
      vi.mocked(gregorianToHijri).mockImplementation((input) => {
        if (input.year === 2026 && input.month === 2) {
          if (input.day === 26) return { year: 1447, month: 9, day: 9 };
          if (input.day === 27) return { year: 1447, month: 9, day: 10 };
        }
        return undefined;
      });

      // @ts-ignore
      vi.mocked(SunCalc.getTimes).mockReturnValue({
        sunset: new Date(2026, 1, 27, 18, 30, 0),
      });

      const options = { offset: 0 };

      // Time well before sunset (morning)
      const resultMorning = fromDate(
        new Date(2026, 1, 26, 9, 0, 0, 0),
        options
      );
      expect(resultMorning.day).toBe(9);

      // Time well after sunset (night)
      const resultNight = fromDate(new Date(2026, 1, 26, 22, 0, 0, 0), options);
      expect(resultNight.day).toBe(10);
    });

    describe("seconds and milliseconds edge cases", () => {
      it("should handle precise time comparison with seconds and milliseconds", () => {
        // @ts-ignore
        vi.mocked(gregorianToHijri).mockImplementation((input) => {
          if (input.year === 2026 && input.month === 2) {
            if (input.day === 26) return { year: 1447, month: 9, day: 9 };
            if (input.day === 27) return { year: 1447, month: 9, day: 10 };
          }
          return undefined;
        });

        // @ts-ignore
        vi.mocked(SunCalc.getTimes).mockReturnValue({
          sunset: new Date(2026, 1, 27, 18, 30, 45, 500),
        });

        const options = { offset: 0 };

        // Time exactly at sunset (18:30:45.500) should advance to next Hijri day
        const resultAtExactSunset = fromDate(
          new Date(2026, 1, 26, 18, 30, 45, 500),
          options
        );
        expect(resultAtExactSunset.day).toBe(10);

        // Time 1 millisecond before sunset should remain same Hijri day
        const resultJustBefore = fromDate(
          new Date(2026, 1, 26, 18, 30, 45, 499),
          options
        );
        expect(resultJustBefore.day).toBe(9);

        // Time 1 millisecond after sunset should advance to next Hijri day
        const resultJustAfter = fromDate(
          new Date(2026, 1, 26, 18, 30, 45, 501),
          options
        );
        expect(resultJustAfter.day).toBe(10);
      });

      it("should convert Hijri date with precise seconds and milliseconds to Gregorian", () => {
        // @ts-ignore
        vi.mocked(hijriToGregorian).mockImplementation((input) => {
          if (input.year === 1447 && input.month === 9) {
            if (input.day === 9) return { year: 2026, month: 2, day: 26 };
            if (input.day === 10) return { year: 2026, month: 2, day: 27 };
          }
          return undefined;
        });

        // @ts-ignore
        vi.mocked(SunCalc.getTimes).mockReturnValue({
          sunset: new Date(2026, 1, 27, 18, 30, 45, 500),
        });

        const hijriDate: HijriDateComponents = { year: 1447, month: 9, day: 9 };
        const hijriTime: TimeComponents = {
          hour: 15,
          minute: 30,
          second: 25,
          millisecond: 750,
        };
        const options = { offset: 0 };

        const result = toDate(hijriDate, hijriTime, options);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(26);
        expect(result.getHours()).toBe(15);
        expect(result.getMinutes()).toBe(30);
        expect(result.getSeconds()).toBe(25);
        expect(result.getMilliseconds()).toBe(750);
      });

      it("should handle undefined seconds and milliseconds gracefully", () => {
        // @ts-ignore
        vi.mocked(hijriToGregorian).mockImplementation((input) => {
          if (input.year === 1447 && input.month === 9) {
            if (input.day === 9) return { year: 2026, month: 2, day: 26 };
            if (input.day === 10) return { year: 2026, month: 2, day: 27 };
          }
          return undefined;
        });

        // @ts-ignore
        vi.mocked(SunCalc.getTimes).mockReturnValue({
          sunset: new Date(2026, 1, 27, 18, 30, 45, 500),
        });

        const hijriDate: HijriDateComponents = { year: 1447, month: 9, day: 9 };
        const hijriTime: TimeComponents = {
          hour: 15,
          minute: 30,
          second: undefined,
          millisecond: undefined,
        }; // seconds and milliseconds undefined
        const options = { offset: 0 };

        const result = toDate(hijriDate, hijriTime, options);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(26);
        expect(result.getHours()).toBe(15);
        expect(result.getMinutes()).toBe(30);
        expect(result.getSeconds()).toBe(0); // Should default to 0
        expect(result.getMilliseconds()).toBe(0); // Should default to 0
      });
    });
  });
});
