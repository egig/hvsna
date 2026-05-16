import { useCallback, useMemo } from "react";
import { useSettings } from "../../settings/useSettings";
import { HijriDate } from "./hijri-date";
import { HijriMonth } from "./hijri-month";
import { getCoordinateFromTimezone } from "@/config";
import { useLocationContext } from "@/modules/location/context";

export * from "./hijri-date";

export interface UseHijriCalendarOptions {
  date?: Date;
  hijriYear?: number;
  hijriMonth?: number;
  hijriDay?: number;
}

export interface UseHijriCalendarReturn {
  // Current hijri date
  currentHijriDate: HijriDate;

  // Settings
  timezone: string;
  latitude?: number;
  longitude?: number;
  manualOffset?: number;

  // Date conversion utilities
  toHijriDate: (date: Date) => HijriDate;
  fromHijriDate: (hijriDate: HijriDate) => Date;
  toGregorianDate: (hijriDate: HijriDate) => Date;

  // Date navigation
  getToday: () => HijriDate;
  getTomorrow: () => HijriDate;
  getYesterday: () => HijriDate;

  // Date utilities
  isToday: (hijriDate: HijriDate) => boolean;
  isTomorrow: (hijriDate: HijriDate) => boolean;
  isSameDay: (date1: HijriDate, date2: HijriDate) => boolean;

  // Week utilities
  getWeekDates: (hijriDate: HijriDate) => HijriDate[];
  getStartOfWeek: (hijriDate: HijriDate) => HijriDate;

  // Formatting
  formatDate: (hijriDate: HijriDate, format: string) => string;

  // Creation utilities
  createHijriDate: (
    year: number,
    month: number,
    day: number,
    hour?: number,
    minute?: number
  ) => HijriDate;
  createHijriMonth: (year: number, month: number) => HijriMonth;
  currentHijriMonth: () => HijriMonth;

  // Whether the user has set a real location (false = silently using default Jakarta coords)
  hasLocation: boolean;

  // Loading and error states
  loading: boolean;
  error: string | null;
  initiated: boolean;
}

export function useHijriDate(): UseHijriCalendarReturn {
  const { settings, loading, error, initiated } = useSettings();
  const { location } = useLocationContext();

  // Extract coordinates and offset from settings
  const _fallback = getCoordinateFromTimezone(settings.timezone ?? "");
  const latitude = location.lat ?? _fallback.latitude;
  const longitude = location.lng ?? _fallback.longitude;
  const hasLocation = !!(latitude && longitude);
  const manualOffset = settings.manualDateOffset;
  const timezone = settings.timezone;

  // Create current hijri date based on options or current time
  const currentHijriDate = useMemo(() => {
    return HijriDate.fromDate(new Date(), {
      latitude,
      longitude,
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Convert Gregorian date to Hijri date
  const toHijriDate = useCallback(
    (date: Date): HijriDate => {
      return HijriDate.fromDate(date, {
        latitude,
        longitude,
        offset: manualOffset,
      });
    },
    [latitude, longitude, manualOffset]
  );

  // Convert Hijri date to Gregorian date
  const fromHijriDate = useCallback((hijriDate: HijriDate): Date => {
    return hijriDate.toDate();
  }, []);

  // Alias for fromHijriDate
  const toGregorianDate = fromHijriDate;

  // Get today's hijri date
  const getToday = useCallback((): HijriDate => {
    return HijriDate.fromDate(new Date(), {
      latitude,
      longitude,
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Get tomorrow's hijri date
  const getTomorrow = useCallback((): HijriDate => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return HijriDate.fromDate(tomorrow, {
      latitude,
      longitude,
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Get yesterday's hijri date
  const getYesterday = useCallback((): HijriDate => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return HijriDate.fromDate(yesterday, {
      latitude,
      longitude,
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Check if hijri date is today
  const isToday = useCallback((hijriDate: HijriDate): boolean => {
    return hijriDate.isToday();
  }, []);

  // Check if hijri date is tomorrow
  const isTomorrow = useCallback((hijriDate: HijriDate): boolean => {
    return hijriDate.isTomorrow();
  }, []);

  // Check if two hijri dates are the same day
  const isSameDay = useCallback(
    (date1: HijriDate, date2: HijriDate): boolean => {
      return (
        date1.year === date2.year &&
        date1.month === date2.month &&
        date1.day === date2.day
      );
    },
    []
  );

  // Get week dates for a hijri date
  const getWeekDates = useCallback((hijriDate: HijriDate): HijriDate[] => {
    return hijriDate.getWeekDates();
  }, []);

  // Get start of week for a hijri date
  const getStartOfWeek = useCallback((hijriDate: HijriDate): HijriDate => {
    return hijriDate.startOfWeek();
  }, []);

  // Format hijri date
  const formatDate = useCallback(
    (hijriDate: HijriDate, format: string): string => {
      return hijriDate.format(format);
    },
    []
  );

  // Create hijri date with specific components
  const createHijriDate = useCallback(
    (
      year: number,
      month: number,
      day: number,
      hour: number | undefined = undefined,
      minute: number | undefined = undefined
    ): HijriDate => {
      return new HijriDate(year, month, day, hour, minute, 0, 0, {
        latitude,
        longitude,
        offset: manualOffset,
      });
    },
    [latitude, longitude, manualOffset]
  );

  // Create hijri month with specific year and month
  const createHijriMonth = useCallback(
    (year: number, month: number): HijriMonth => {
      return new HijriMonth(year, month, {
        latitude,
        longitude,
        offset: manualOffset,
      });
    },
    [latitude, longitude, manualOffset]
  );

  // Get current hijri month
  const currentHijriMonth = useCallback((): HijriMonth => {
    return HijriMonth.getCurrent({
      latitude,
      longitude,
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  return {
    // Current hijri date
    currentHijriDate,

    // Settings
    timezone,
    latitude,
    longitude,
    manualOffset,

    // Date conversion utilities
    toHijriDate,
    fromHijriDate,
    toGregorianDate,

    // Date navigation
    getToday,
    getTomorrow,
    getYesterday,

    // Date utilities
    isToday,
    isTomorrow,
    isSameDay,

    // Week utilities
    getWeekDates,
    getStartOfWeek,

    // Formatting
    formatDate,

    // Creation utilities
    createHijriDate,
    createHijriMonth,
    currentHijriMonth,

    // Location state
    hasLocation,

    // Loading and error states
    loading,
    error,
    initiated,
  };
}
