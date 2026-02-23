import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHijriCalendar } from "../useHijriCalendar";
import { HijriDate } from "../hijri-date";

// Mock the useSettings hook
vi.mock("../../../settings/useSettings", () => ({
  useSettings: vi.fn(),
}));

import { useSettings } from "../../../settings/useSettings";

// Mock HijriDate class
vi.mock("../hijri-date", () => ({
  HijriDate: {
    fromDate: vi.fn(),
    hijriToJsDate: vi.fn(),
  },
}));

describe("useHijriCalendar", () => {
  const mockUseSettings = vi.mocked(useSettings);
  const mockHijriDate = vi.mocked(HijriDate);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock settings
    mockUseSettings.mockReturnValue({
      settings: {
        timezone: "Asia/Jakarta",
        coordinate: {
          latitude: -6.2088,
          longitude: 106.8456,
        },
        manualDateOffset: 0,
      },
      loading: false,
      error: null,
      initiated: true,
    } as any);

    // Default mock HijriDate instance
    const mockHijriDateInstance = {
      year: 1445,
      month: 10,
      day: 15,
      hour: 12,
      minute: 30,
      isToday: vi.fn().mockReturnValue(false),
      isTomorrow: vi.fn().mockReturnValue(false),
      getWeekDates: vi.fn().mockReturnValue([]),
      startOfWeek: vi.fn().mockReturnValue({}),
      format: vi.fn().mockReturnValue("1445-10-15"),
      toDate: vi.fn().mockReturnValue(new Date("2024-05-23T12:30:00")),
    } as any;

    mockHijriDate.fromDate.mockReturnValue(mockHijriDateInstance);
    mockHijriDate.hijriToJsDate.mockReturnValue(
      new Date("2024-05-23T12:30:00"),
    );
  });

  it("should return current hijri date with default options", () => {
    const { result } = renderHook(() => useHijriCalendar());

    expect(result.current.currentHijriDate).toBeDefined();
    expect(result.current.timezone).toBe("Asia/Jakarta");
    expect(result.current.latitude).toBe(-6.2088);
    expect(result.current.longitude).toBe(106.8456);
    expect(result.current.manualOffset).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.initiated).toBe(true);
  });

  it("should use provided date option", () => {
    const customDate = new Date("2024-06-01T10:00:00");

    renderHook(() => useHijriCalendar({ date: customDate }));

    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      customDate,
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should use provided hijri date components", () => {
    renderHook(() =>
      useHijriCalendar({
        hijriYear: 1446,
        hijriMonth: 1,
        hijriDay: 1,
      }),
    );

    expect(mockHijriDate.hijriToJsDate).toHaveBeenCalledWith(
      1446,
      1,
      1,
      0,
      0,
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should handle missing coordinates", () => {
    mockUseSettings.mockReturnValue({
      settings: {
        timezone: "Asia/Jakarta",
        coordinate: undefined,
        manualDateOffset: 1,
      },
      loading: false,
      error: null,
      initiated: true,
    } as any);

    const { result } = renderHook(() => useHijriCalendar());

    expect(result.current.latitude).toBeUndefined();
    expect(result.current.longitude).toBeUndefined();
    expect(result.current.manualOffset).toBe(1);
  });

  it("should convert gregorian date to hijri date", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const testDate = new Date("2024-06-01T10:00:00");

    result.current.toHijriDate(testDate);

    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      testDate,
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should convert hijri date to gregorian date", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.fromHijriDate(mockHijriInstance);

    expect(mockHijriInstance.toDate).toHaveBeenCalled();
  });

  it("should get today's hijri date", () => {
    const { result } = renderHook(() => useHijriCalendar());

    result.current.getToday();

    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      expect.any(Date),
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should get tomorrow's hijri date", () => {
    const { result } = renderHook(() => useHijriCalendar());

    result.current.getTomorrow();

    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      expect.any(Date),
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should get yesterday's hijri date", () => {
    const { result } = renderHook(() => useHijriCalendar());

    result.current.getYesterday();

    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      expect.any(Date),
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should check if hijri date is today", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.isToday(mockHijriInstance);

    expect(mockHijriInstance.isToday).toHaveBeenCalled();
  });

  it("should check if hijri date is tomorrow", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.isTomorrow(mockHijriInstance);

    expect(mockHijriInstance.isTomorrow).toHaveBeenCalled();
  });

  it("should check if two hijri dates are same day", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const date1 = { year: 1445, month: 10, day: 15 };
    const date2 = { year: 1445, month: 10, day: 15 };
    const date3 = { year: 1445, month: 10, day: 16 };

    expect(result.current.isSameDay(date1 as any, date2 as any)).toBe(true);
    expect(result.current.isSameDay(date1 as any, date3 as any)).toBe(false);
  });

  it("should get week dates", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.getWeekDates(mockHijriInstance);

    expect(mockHijriInstance.getWeekDates).toHaveBeenCalled();
  });

  it("should get start of week", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.getStartOfWeek(mockHijriInstance);

    expect(mockHijriInstance.startOfWeek).toHaveBeenCalled();
  });

  it("should format hijri date", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.formatDate(mockHijriInstance, "YYYY-MM-DD");

    expect(mockHijriInstance.format).toHaveBeenCalledWith("YYYY-MM-DD");
  });

  it("should create hijri date with specific components", () => {
    const { result } = renderHook(() => useHijriCalendar());

    result.current.createHijriDate(1446, 1, 1, 12, 30);

    expect(mockHijriDate.hijriToJsDate).toHaveBeenCalledWith(
      1446,
      1,
      1,
      12,
      30,
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should create hijri date with default time", () => {
    const { result } = renderHook(() => useHijriCalendar());

    result.current.createHijriDate(1446, 1, 1);

    expect(mockHijriDate.hijriToJsDate).toHaveBeenCalledWith(
      1446,
      1,
      1,
      undefined,
      undefined,
      -6.2088,
      106.8456,
      { offset: 0 },
    );
  });

  it("should handle loading state", () => {
    mockUseSettings.mockReturnValue({
      settings: {
        timezone: "Asia/Jakarta",
        coordinate: undefined,
        manualDateOffset: 0,
      },
      loading: true,
      error: null,
      initiated: false,
    } as any);

    const { result } = renderHook(() => useHijriCalendar());

    expect(result.current.loading).toBe(true);
    expect(result.current.initiated).toBe(false);
  });

  it("should handle error state", () => {
    mockUseSettings.mockReturnValue({
      settings: {
        timezone: "Asia/Jakarta",
        coordinate: undefined,
        manualDateOffset: 0,
      },
      loading: false,
      error: "Failed to load settings",
      initiated: true,
    } as any);

    const { result } = renderHook(() => useHijriCalendar());

    expect(result.current.error).toBe("Failed to load settings");
  });

  it("should use manual offset in all date operations", () => {
    mockUseSettings.mockReturnValue({
      settings: {
        timezone: "Asia/Jakarta",
        coordinate: {
          latitude: -6.2088,
          longitude: 106.8456,
        },
        manualDateOffset: 2,
      },
      loading: false,
      error: null,
      initiated: true,
    } as any);

    const { result } = renderHook(() => useHijriCalendar());

    // Test that manual offset is passed to HijriDate operations
    result.current.getToday();
    expect(mockHijriDate.fromDate).toHaveBeenCalledWith(
      expect.any(Date),
      -6.2088,
      106.8456,
      { offset: 2 },
    );

    result.current.createHijriDate(1446, 1, 1);
    expect(mockHijriDate.hijriToJsDate).toHaveBeenCalledWith(
      1446,
      1,
      1,
      undefined,
      undefined,
      -6.2088,
      106.8456,
      { offset: 2 },
    );
  });

  it("should provide toGregorianDate alias", () => {
    const { result } = renderHook(() => useHijriCalendar());
    const mockHijriInstance = mockHijriDate.fromDate.mock.results[0].value;

    result.current.toGregorianDate(mockHijriInstance);

    expect(mockHijriInstance.toDate).toHaveBeenCalled();
  });
});
