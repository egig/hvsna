/**
 * Reusable helper functions for task form operations
 */
import { HijriDate, useHijriDate } from "../calendar/hijri";
import type { TaskRecurringType } from "@/domain/task";
import { usePrayerTimes } from "../prayer";

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
      let d = createHijriDate(year, month, day);
      return getPrayerEndTime(atTime.toLowerCase(), d).valueOf();
    }

    if (!!atTime && atTime.includes(":")) {
      const [h, m] = atTime.split(":").map(Number);
      return createHijriDate(year, month, day, h, m).toDate().valueOf();
    }

    let r = createHijriDate(year, month, day);
    let e = r.endOfDay().toDate();
    return e.valueOf();
  };
}
