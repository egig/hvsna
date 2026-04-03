import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPrayerTimes, type PrayerTimesParams } from "../../modules/prayer-times";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("getPrayerTimes", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should fetch prayer times with correct parameters", async () => {
    const mockResponse = {
      code: 200,
      status: "OK",
      data: {
        timings: {
          Fajr: "06:03",
          Sunrise: "08:06",
          Dhuhr: "12:04",
          Asr: "13:44",
          Sunset: "16:03",
          Maghrib: "16:03",
          Isha: "17:59",
          Imsak: "05:53",
          Midnight: "00:04",
          Firstthird: "21:24",
          Lastthird: "02:45",
        },
        date: {
          readable: "01 Jan 2025",
          timestamp: "1735714800",
          hijri: {
            date: "01-07-1446",
            format: "DD-MM-YYYY",
            day: "1",
            weekday: { en: "Al Arba'a", ar: "الاربعاء" },
            month: { number: 7, en: "Rajab", ar: "رَجَب", days: 30 },
            year: "1446",
            designation: { abbreviated: "AH", expanded: "Anno Hegirae" },
            holidays: ["Beginning of the holy months"],
            adjustedHolidays: [],
            method: "HJCoSA",
          },
          gregorian: {
            date: "01-01-2025",
            format: "DD-MM-YYYY",
            day: "01",
            weekday: { en: "Wednesday" },
            month: { number: 1, en: "January" },
            year: "2025",
            designation: { abbreviated: "AD", expanded: "Anno Domini" },
            lunarSighting: false,
          },
        },
        meta: {
          latitude: 51.5194682,
          longitude: -0.1360365,
          timezone: "UTC",
          method: {
            id: 3,
            name: "Muslim World League",
            params: { Fajr: 18, Isha: 17 },
            location: { latitude: 51.5194682, longitude: -0.1360365 },
          },
          latitudeAdjustmentMethod: "ANGLE_BASED",
          midnightMode: "STANDARD",
          school: "STANDARD",
          offset: {
            Imsak: 0,
            Fajr: 0,
            Sunrise: 0,
            Dhuhr: 0,
            Asr: 0,
            Sunset: 0,
            Maghrib: 0,
            Isha: 0,
            Midnight: 0,
          },
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const params: PrayerTimesParams = {
      date: "01-01-2025",
      latitude: 51.5194682,
      longitude: -0.1360365,
    };

    const result = await getPrayerTimes(params);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.aladhan.com/v1/timings/01-01-2025?latitude=51.5194682&longitude=-0.1360365&method=20&shafaq=general&tune=0%2C0%2C0%2C0%2C0%2C0%2C0%2C0%2C0&timezonestring=Asia%2FJakarta&calendarMethod=UAQ",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      },
    );

    expect(result).toEqual(mockResponse);
  });

  it("should use custom parameters when provided", async () => {
    const mockResponse = {
      code: 200,
      status: "OK",
      data: {
        timings: {},
        date: {},
        meta: {},
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const params: PrayerTimesParams = {
      date: "15-08-2025",
      latitude: 40.7128,
      longitude: -74.006,
      method: 2,
      shafaq: "habibi",
      tune: "1,2,3,4,5,6,7,8,9",
      timezonestring: "America/New_York",
      calendarMethod: "CUSTOM",
    };

    await getPrayerTimes(params);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("method=2"),
      expect.any(Object),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("shafaq=habibi"),
      expect.any(Object),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("timezonestring=America%2FNew_York"),
      expect.any(Object),
    );
  });

  it("should throw error when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const params: PrayerTimesParams = {
      date: "01-01-2025",
      latitude: 51.5194682,
      longitude: -0.1360365,
    };

    await expect(getPrayerTimes(params)).rejects.toThrow(
      "Failed to fetch prayer times: HTTP error! status: 404",
    );
  });

  it("should throw error when network fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const params: PrayerTimesParams = {
      date: "01-01-2025",
      latitude: 51.5194682,
      longitude: -0.1360365,
    };

    await expect(getPrayerTimes(params)).rejects.toThrow(
      "Failed to fetch prayer times: Network error",
    );
  });
});
