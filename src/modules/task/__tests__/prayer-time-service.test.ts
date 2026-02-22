import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPrayerTimesForDate,
  getPrayerTimeValue,
  calculateTaskTime,
  getPrayerBasedTaskTime,
  formatPrayerTimeDisplay,
  clearPrayerTimesCache,
} from "../prayer-time-service";
import { HijriDate } from "../../calendar/hijri";
import type { PrayerTime } from "../types";

// Mock the prayer times API
vi.mock("../../../lib/prayer-times", () => ({
  getPrayerTimes: vi.fn(),
}));

import { getPrayerTimes } from "../../../lib/prayer-times";

describe("Prayer Time Service", () => {
  beforeEach(() => {
    clearPrayerTimesCache();
    vi.clearAllMocks();
  });

  describe("getPrayerTimesForDate", () => {
    it("should cache prayer times response", async () => {
      const mockResponse = {
        code: 200,
        status: "OK",
        data: {
          timings: {
            Fajr: "05:30",
            Sunrise: "06:45",
            Dhuhr: "12:15",
            Asr: "15:30",
            Maghrib: "18:00",
            Isha: "19:15",
          },
        },
      };

      (getPrayerTimes as any).mockResolvedValue(mockResponse);

      const date = new Date("2024-01-01");
      const latitude = -6.2088;
      const longitude = 106.8456;

      // First call should fetch from API
      const result1 = await getPrayerTimesForDate(date, latitude, longitude);
      expect(getPrayerTimes).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockResponse);

      // Second call should use cache
      const result2 = await getPrayerTimesForDate(date, latitude, longitude);
      expect(getPrayerTimes).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toEqual(mockResponse);
    });

    it("should handle API errors gracefully", async () => {
      (getPrayerTimes as any).mockRejectedValue(new Error("API Error"));

      const date = new Date("2024-01-01");

      await expect(
        getPrayerTimesForDate(date, -6.2088, 106.8456),
      ).rejects.toThrow(
        "Failed to fetch prayer times for 2024-01-01: API Error",
      );
    });
  });

  describe("getPrayerTimeValue", () => {
    it("should extract correct prayer time from response", () => {
      const mockResponse = {
        code: 200,
        status: "OK",
        data: {
          timings: {
            Fajr: "05:30",
            Sunrise: "06:45",
            Dhuhr: "12:15",
            Asr: "15:30",
            Maghrib: "18:00",
            Isha: "19:15",
          },
        },
      };

      expect(getPrayerTimeValue(mockResponse, "Fajr")).toBe("05:30");
      expect(getPrayerTimeValue(mockResponse, "Dhuhr")).toBe("12:15");
      expect(getPrayerTimeValue(mockResponse, "Isha")).toBe("19:15");
    });

    it("should throw error for unknown prayer time", () => {
      const mockResponse = {
        data: { timings: {} },
      };

      expect(() =>
        getPrayerTimeValue(mockResponse, "Unknown" as PrayerTime),
      ).toThrow("Unknown prayer time: Unknown");
    });
  });

  describe("calculateTaskTime", () => {
    it("should calculate task time with positive offset", () => {
      const prayerTime = "12:15";
      const offsetMinutes = 30;
      const date = new Date("2024-01-01T12:00:00");

      const result = calculateTaskTime(prayerTime, offsetMinutes, date);

      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(45);
    });

    it("should calculate task time with negative offset", () => {
      const prayerTime = "12:15";
      const offsetMinutes = -15;
      const date = new Date("2024-01-01T12:00:00");

      const result = calculateTaskTime(prayerTime, offsetMinutes, date);

      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });

    it("should handle hour rollover correctly", () => {
      const prayerTime = "23:30";
      const offsetMinutes = 45;
      const date = new Date("2024-01-01T12:00:00");

      const result = calculateTaskTime(prayerTime, offsetMinutes, date);

      expect(result.getHours()).toBe(0); // Should roll over to next day
      expect(result.getMinutes()).toBe(15);
    });
  });

  describe("getPrayerBasedTaskTime", () => {
    it("should calculate task time for prayer-based scheduling", async () => {
      const mockResponse = {
        data: {
          timings: {
            Fajr: "05:30",
            Dhuhr: "12:15",
            Maghrib: "18:00",
          },
        },
      };

      (getPrayerTimes as any).mockResolvedValue(mockResponse);

      const hijriDate = HijriDate.fromDate(new Date(2023, 6, 6)); // Approximate date for testing
      const prayerTime: PrayerTime = "Dhuhr";
      const offsetMinutes = 15;

      const result = await getPrayerBasedTaskTime(
        hijriDate,
        prayerTime,
        offsetMinutes,
        -6.2088,
        106.8456,
      );

      expect(result.time).toBe("12:30");
      expect(result.epochMillis).toBeGreaterThan(0);
    });
  });

  describe("formatPrayerTimeDisplay", () => {
    it("should format prayer time with no offset", () => {
      const result = formatPrayerTimeDisplay("Fajr", 0);
      expect(result).toBe("Fajr");
    });

    it("should format prayer time with positive offset", () => {
      const result = formatPrayerTimeDisplay("Fajr", 15);
      expect(result).toBe("Fajr +15min");
    });

    it("should format prayer time with negative offset", () => {
      const result = formatPrayerTimeDisplay("Fajr", -10);
      expect(result).toBe("Fajr -10min");
    });
  });
});
