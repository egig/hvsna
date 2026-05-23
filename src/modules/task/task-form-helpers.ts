/**
 * Reusable helper functions for task form operations
 */
import { HijriDate, useHijriDate } from "../calendar/hijri";
import type { TaskRecurringType } from "@/domain/task";
import { usePrayerTimes } from "../prayer";

/**
 * Computes the next occurrence Hijri date string (YYYYMMDD) given a current date and repeat type.
 * Returns null if repeat is "none" or inputs are invalid.
 */
export function getNextOccurrenceDate(
  atDateHijri: string,
  recurringType: TaskRecurringType,
  interval = 1,
  lat = 0,
  long = 0,
  offset = 0,
  hour: number | undefined,
  minutes: number | undefined,
  useGregorian = false
): string | null {
  if (!recurringType || recurringType === "none" || !atDateHijri) return null;

  const n = Math.max(1, interval);
  const { year, month, day } = parseHijriDateString(atDateHijri);
  const coords = { latitude: lat, longitude: long, offset };

  if (recurringType === "daily" || recurringType === "weekly") {
    const days = recurringType === "weekly" ? n * 7 : n;
    const hijriDate = new HijriDate(
      year,
      month,
      day,
      hour,
      minutes,
      0,
      0,
      coords
    );
    const greg = hijriDate.toDate();
    greg.setDate(greg.getDate() + days);
    const next = HijriDate.fromDate(greg, coords);
    return formatHijriDateString(next.year, next.month, next.day);
  }

  if (recurringType === "monthly") {
    if (useGregorian) {
      const greg = new HijriDate(
        year,
        month,
        day,
        hour,
        minutes,
        0,
        0,
        coords
      ).toDate();
      greg.setMonth(greg.getMonth() + n);
      const next = HijriDate.fromDate(greg, coords);
      return formatHijriDateString(next.year, next.month, next.day);
    }
    const totalMonths = year * 12 + (month - 1) + n;
    const nextYear = Math.floor(totalMonths / 12);
    const nextMonth = (totalMonths % 12) + 1;
    // Cap day at 29 to avoid invalid end-of-month dates (Hijri months are 29–30 days)
    return formatHijriDateString(nextYear, nextMonth, Math.min(day, 29));
  }

  if (recurringType === "yearly") {
    if (useGregorian) {
      const greg = new HijriDate(
        year,
        month,
        day,
        hour,
        minutes,
        0,
        0,
        coords
      ).toDate();
      greg.setFullYear(greg.getFullYear() + n);
      const next = HijriDate.fromDate(greg, coords);
      return formatHijriDateString(next.year, next.month, next.day);
    }
    return formatHijriDateString(year + n, month, day);
  }

  return null;
}

/**
 * Parses a Hijri date string in YYYYMMDD format into year, month, and day components
 * @param hijriDateString - The Hijri date string in YYYYMMDD format
 * @returns Object containing year, month, and day as numbers
 * @throws Error if the date string is not in the expected format
 */
export function parseHijriDateString(hijriDateString: string): {
  year: number;
  month: number;
  day: number;
} {
  if (!hijriDateString || hijriDateString.length !== 8) {
    throw new Error(
      `Invalid Hijri date format: ${hijriDateString}. Expected YYYYMMDD format.`
    );
  }

  const year = parseInt(hijriDateString.substring(0, 4));
  const month = parseInt(hijriDateString.substring(4, 6));
  const day = parseInt(hijriDateString.substring(6, 8));

  // Validate the parsed values
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid Hijri date components in: ${hijriDateString}`);
  }

  if (month < 1 || month > 12) {
    throw new Error(
      `Invalid month ${month} in Hijri date: ${hijriDateString}. Month must be 1-12.`
    );
  }

  if (day < 1 || day > 30) {
    throw new Error(
      `Invalid day ${day} in Hijri date: ${hijriDateString}. Day must be 1-30.`
    );
  }

  return { year, month, day };
}

/**
 * Formats Hijri date components into YYYYMMDD string format
 * @param year - Hijri year
 * @param month - Hijri month (1-12)
 * @param day - Hijri day (1-30)
 * @returns Formatted Hijri date string in YYYYMMDD format
 */
export function formatHijriDateString(
  year: number,
  month: number,
  day: number
): string {
  const yearStr = year.toString().padStart(4, "0");
  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");

  return `${yearStr}${monthStr}${dayStr}`;
}

/**
 * Parses a time string in HH:MM format into hour and minute components
 * @param timeString - The time string in HH:MM format
 * @returns Object containing hour and minute as numbers
 * @throws Error if the time string is not in the expected format
 */
export function parseTimeString(timeString: string): {
  hour: number;
  minute: number;
} {
  if (!timeString) {
    return { hour: 0, minute: 0 };
  }

  const timeParts = timeString.split(":");
  if (timeParts.length !== 2) {
    // Return zeros for invalid format instead of throwing error
    return { hour: 0, minute: 0 };
  }

  const hour = parseInt(timeParts[0]) || 0;
  const minute = parseInt(timeParts[1]) || 0;

  // Validate the parsed values
  if (hour < 0 || hour > 23) {
    throw new Error(
      `Invalid hour ${hour} in time: ${timeString}. Hour must be 0-23.`
    );
  }

  if (minute < 0 || minute > 59) {
    throw new Error(
      `Invalid minute ${minute} in time: ${timeString}. Minute must be 0-59.`
    );
  }

  return { hour, minute };
}

export function useTaskEpoch() {
  const { getPrayerEndTime } = usePrayerTimes();
  const { createHijriDate } = useHijriDate();
  return function getTaskEpoch(
    year: number,
    month: number,
    day: number,
    atTime: string
  ): number | null {
    if (!!atTime && !atTime.includes(":")) {
      let d = createHijriDate(year, month, day, undefined, undefined);
      return getPrayerEndTime(atTime.toLowerCase(), d).valueOf();
    }

    if (!!atTime && atTime.includes(":")) {
      const [h, m] = atTime.split(":").map(Number);
      return createHijriDate(year, month, day, h, m).toDate().valueOf();
    }

    return createHijriDate(year, month, day, undefined, undefined)
      .endOfDay()
      .toDate()
      .valueOf();
  };
}
