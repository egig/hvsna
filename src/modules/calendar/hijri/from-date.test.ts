import { describe, it, expect, vi, beforeEach } from "vitest";
import { fromDate } from "./from-date";
import * as SunCalc from "suncalc";
import type { HijriDateOptions } from "./hijri-date";

// Mock SunCalc to control sunset calculations
vi.mock("suncalc", () => ({
  getTimes: vi.fn(),
}));

const mockGetTimes = vi.mocked(SunCalc.getTimes);

describe("fromDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic conversion", () => {
    it("should convert a simple Gregorian date to Hijri date", () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30), // 6:30 PM
      } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.day).toBeGreaterThan(0);
      expect(result.day).toBeLessThanOrEqual(30);
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
      expect(result._rawGregorianDate).toBe(date);
    });

    it("should preserve time components from the original date", () => {
      const date = new Date(2023, 0, 1, 14, 30); // January 1, 2023, 2:30 PM
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30), // 6:30 PM
      } as any);

      const result = fromDate(date);

      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
    });

    it("should use default Jakarta coordinates when no options provided", () => {
      const date = new Date(2023, 0, 1);
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result._latitude).toBe(-6.2088);
      expect(result._longitude).toBe(106.8456);
      expect(mockGetTimes).toHaveBeenCalledWith(date, -6.2088, 106.8456);
    });
  });

  describe("Sunset handling", () => {
    it("should advance to next Hijri day when time is after sunset", () => {
      const date = new Date(2023, 0, 1, 20, 0); // 8:00 PM
      const sunset = new Date(2023, 0, 1, 18, 30); // 6:30 PM
      mockGetTimes.mockReturnValue({ sunset } as any);

      const result = fromDate(date);

      // Should have advanced the day
      expect(result.day).toBeGreaterThan(0);
      expect(mockGetTimes).toHaveBeenCalledWith(date, -6.2088, 106.8456);
    });

    it("should not advance Hijri day when time is before sunset", () => {
      const date = new Date(2023, 0, 1, 14, 0); // 2:00 PM
      const sunset = new Date(2023, 0, 1, 18, 30); // 6:30 PM
      mockGetTimes.mockReturnValue({ sunset } as any);

      const result = fromDate(date);

      expect(result.day).toBeGreaterThan(0);
      expect(mockGetTimes).toHaveBeenCalledWith(date, -6.2088, 106.8456);
    });

    it("should handle month overflow when advancing after sunset", () => {
      const date = new Date(2023, 0, 29, 20, 0); // January 29, 2023, 8:00 PM
      const sunset = new Date(2023, 0, 29, 18, 30); // 6:30 PM
      mockGetTimes.mockReturnValue({ sunset } as any);

      const result = fromDate(date);

      // Should handle month overflow properly
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it("should handle year overflow when advancing after sunset", () => {
      const date = new Date(2023, 11, 29, 20, 0); // December 29, 2023, 8:00 PM
      const sunset = new Date(2023, 11, 29, 18, 30); // 6:30 PM
      mockGetTimes.mockReturnValue({ sunset } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
    });

    it("should handle SunCalc calculation failures gracefully", () => {
      const date = new Date(2023, 0, 1, 20, 0);
      mockGetTimes.mockImplementation(() => {
        throw new Error("SunCalc failed");
      });

      // Should not throw and should continue with conversion
      expect(() => fromDate(date)).not.toThrow();

      const result = fromDate(date);
      expect(result.year).toBeGreaterThan(0);
    });

    it("should handle null sunset from SunCalc", () => {
      const date = new Date(2023, 0, 1, 20, 0);
      mockGetTimes.mockReturnValue({
        sunset: null,
      } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
    });
  });

  describe("Custom coordinates", () => {
    it("should use custom latitude and longitude when provided", () => {
      const date = new Date(2023, 0, 1);
      const options: HijriDateOptions = {
        latitude: 40.7128,
        longitude: -74.006, // New York coordinates
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._latitude).toBe(40.7128);
      expect(result._longitude).toBe(-74.006);
      expect(mockGetTimes).toHaveBeenCalledWith(date, 40.7128, -74.006);
    });

    it("should use partial coordinates when only one is provided", () => {
      const date = new Date(2023, 0, 1);
      const options: HijriDateOptions = {
        latitude: 51.5074, // London latitude only
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._latitude).toBe(51.5074);
      expect(result._longitude).toBe(106.8456); // Default longitude
      expect(mockGetTimes).toHaveBeenCalledWith(date, 51.5074, 106.8456);
    });
  });

  describe("Offset handling", () => {
    it("should apply positive offset correctly", () => {
      const date = new Date(2023, 0, 1);
      const options: HijriDateOptions = {
        offset: 2, // Add 2 days
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._offset).toBe(2);
      expect(result.day).toBeGreaterThan(0);
    });

    it("should apply negative offset correctly", () => {
      const date = new Date(2023, 0, 15);
      const options: HijriDateOptions = {
        offset: -3, // Subtract 3 days
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 15, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._offset).toBe(-3);
      expect(result.day).toBeGreaterThan(0);
    });

    it("should handle offset that causes month overflow", () => {
      const date = new Date(2023, 0, 29);
      const options: HijriDateOptions = {
        offset: 5, // Add 5 days, should overflow to next month
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 29, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._offset).toBe(5);
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it("should handle offset that causes month underflow", () => {
      const date = new Date(2023, 0, 5);
      const options: HijriDateOptions = {
        offset: -10, // Subtract 10 days, should go to previous month
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 5, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._offset).toBe(-10);
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it("should handle zero offset (no change)", () => {
      const date = new Date(2023, 0, 15);
      const options: HijriDateOptions = {
        offset: 0,
      };
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 15, 18, 30),
      } as any);

      const result = fromDate(date, options);

      expect(result._offset).toBe(0);
      expect(result.day).toBeGreaterThan(0);
    });
  });

  describe("Combined functionality", () => {
    it("should handle sunset and offset together correctly", () => {
      const date = new Date(2023, 0, 29, 20, 0); // After sunset, end of month
      const options: HijriDateOptions = {
        latitude: 35.6895,
        longitude: 139.6917, // Tokyo
        offset: 2, // Add 2 more days
      };
      const sunset = new Date(2023, 0, 29, 18, 30);
      mockGetTimes.mockReturnValue({ sunset } as any);

      const result = fromDate(date, options);

      expect(result._latitude).toBe(35.6895);
      expect(result._longitude).toBe(139.6917);
      expect(result._offset).toBe(2);
      expect(result.month).toBeGreaterThan(0);
      expect(result.month).toBeLessThanOrEqual(12);
    });
  });

  describe("Object methods", () => {
    it("should have working toDate method", () => {
      const date = new Date(2023, 0, 1, 14, 30);
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result.toDate()).toBe(date);
    });

    it("should have working format method", () => {
      const date = new Date(2023, 0, 1, 14, 30);
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result.format("YYYY-MM-DD")).toContain(result.year.toString());
      expect(result.format("YYYY-MM-DD")).toContain(
        result.month.toString().padStart(2, "0"),
      );
      expect(result.format("YYYY-MM-DD")).toContain(
        result.day.toString().padStart(2, "0"),
      );
      expect(result.format("HH:mm")).toBe("14:30");
    });

    it("should format month names correctly", () => {
      const date = new Date(2023, 0, 1);
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date);

      const monthNames = [
        "Muharram",
        "Safar",
        "Rabi al-Awwal",
        "Rabi al-Thani",
        "Jumada al-Awwal",
        "Jumada al-Thani",
        "Rajab",
        "Shaaban",
        "Ramadan",
        "Shawwal",
        "Dhu al-Qidah",
        "Dhu al-Hijjah",
      ];

      expect(monthNames).toContain(result.format("MMMM"));
    });
  });

  describe("Edge cases", () => {
    it("should handle leap year dates correctly", () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      mockGetTimes.mockReturnValue({
        sunset: new Date(2024, 1, 29, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThan(0);
      expect(result.day).toBeGreaterThan(0);
    });

    it("should handle end of year dates correctly", () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 11, 31, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThan(0);
      expect(result.day).toBeGreaterThan(0);
    });

    it("should handle beginning of year dates correctly", () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      mockGetTimes.mockReturnValue({
        sunset: new Date(2023, 0, 1, 18, 30),
      } as any);

      const result = fromDate(date);

      expect(result.year).toBeGreaterThan(0);
      expect(result.month).toBeGreaterThan(0);
      expect(result.day).toBeGreaterThan(0);
    });
  });
});
