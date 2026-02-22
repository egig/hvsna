import { useCallback, useMemo } from "react";
import { useSettings } from "../../settings/useSettings";
import { HijriDate } from "./hijri-date";

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
    minute?: number,
  ) => HijriDate;

  // Loading and error states
  loading: boolean;
  error: string | null;
  initiated: boolean;
}

export function useHijriCalendar(
  options: UseHijriCalendarOptions = {},
): UseHijriCalendarReturn {
  const { settings, loading, error, initiated } = useSettings();

  // Extract coordinates and offset from settings
  const latitude = settings.coordinate?.latitude;
  const longitude = settings.coordinate?.longitude;
  const manualOffset = settings.manualDateOffset;
  const timezone = settings.timezone;

  // Create current hijri date based on options or current time
  const currentHijriDate = useMemo(() => {
    const date =
      options.date ||
      (options.hijriYear && options.hijriMonth && options.hijriDay
        ? HijriDate.hijriToJsDate(
            options.hijriYear,
            options.hijriMonth,
            options.hijriDay,
            0,
            0,
            latitude,
            longitude,
            { offset: manualOffset },
          )
        : new Date());

    return HijriDate.fromDate(date, latitude, longitude, {
      offset: manualOffset,
    });
  }, [
    options.date,
    options.hijriYear,
    options.hijriMonth,
    options.hijriDay,
    latitude,
    longitude,
    manualOffset,
  ]);

  // Convert Gregorian date to Hijri date
  const toHijriDate = useCallback(
    (date: Date): HijriDate => {
      return HijriDate.fromDate(date, latitude, longitude, {
        offset: manualOffset,
      });
    },
    [latitude, longitude, manualOffset],
  );

  // Convert Hijri date to Gregorian date
  const fromHijriDate = useCallback((hijriDate: HijriDate): Date => {
    return hijriDate.toDate();
  }, []);

  // Alias for fromHijriDate
  const toGregorianDate = fromHijriDate;

  // Get today's hijri date
  const getToday = useCallback((): HijriDate => {
    return HijriDate.fromDate(new Date(), latitude, longitude, {
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Get tomorrow's hijri date
  const getTomorrow = useCallback((): HijriDate => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return HijriDate.fromDate(tomorrow, latitude, longitude, {
      offset: manualOffset,
    });
  }, [latitude, longitude, manualOffset]);

  // Get yesterday's hijri date
  const getYesterday = useCallback((): HijriDate => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return HijriDate.fromDate(yesterday, latitude, longitude, {
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
    [],
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
    [],
  );

  // Create hijri date with specific components
  const createHijriDate = useCallback(
    (
      year: number,
      month: number,
      day: number,
      hour: number = 0,
      minute: number = 0,
    ): HijriDate => {
      const jsDate = HijriDate.hijriToJsDate(
        year,
        month,
        day,
        hour,
        minute,
        latitude,
        longitude,
        { offset: manualOffset },
      );
      return HijriDate.fromDate(jsDate, latitude, longitude, {
        offset: manualOffset,
      });
    },
    [latitude, longitude, manualOffset],
  );

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

    // Loading and error states
    loading,
    error,
    initiated,
  };
}
