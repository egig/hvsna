/**
 * Reusable helper functions for task form operations
 */
import { HijriDate } from "../calendar/hijri";
import type { TaskRepeat } from "@/domain/task";
import type { TaskScheduleAt } from "./task-form-types";
import { getPrayerTimeForDate } from "../prayer";
import type { PrayerTimes } from "adhan";

/**
 * Computes the next occurrence Hijri date string (YYYYMMDD) given a current date and repeat type.
 * Returns null if repeat is "none" or inputs are invalid.
 */
export function getNextOccurrenceDate(
  atDateHijri: string,
  repeat: TaskRepeat,
  interval = 1,
  lat = 0,
  long = 0,
  offset = 0,
  hour: number | undefined,
  minutes: number | undefined
): string | null {
  if (!repeat || repeat === "none" || !atDateHijri) return null;

  const n = Math.max(1, interval);
  const { year, month, day } = parseHijriDateString(atDateHijri);

  if (repeat === "daily" || repeat === "weekly") {
    const days = repeat === "weekly" ? n * 7 : n;
    const hijriDate = new HijriDate(year, month, day, hour, minutes, 0, 0, {
      latitude: lat,
      longitude: long,
      offset,
    });
    const greg = hijriDate.toDate();
    greg.setDate(greg.getDate() + days);
    const next = HijriDate.fromDate(greg, {
      latitude: lat,
      longitude: long,
      offset,
    });
    return formatHijriDateString(next.year, next.month, next.day);
  }

  if (repeat === "monthly") {
    const totalMonths = year * 12 + (month - 1) + n;
    const nextYear = Math.floor(totalMonths / 12);
    const nextMonth = (totalMonths % 12) + 1;
    // Cap day at 29 to avoid invalid end-of-month dates (Hijri months are 29–30 days)
    return formatHijriDateString(nextYear, nextMonth, Math.min(day, 29));
  }

  if (repeat === "yearly") {
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

export function getTaskEpoch(
  scheduleAt: TaskScheduleAt,
  lat: number,
  lng: number,
  offset: number
): number | null {
  if (!scheduleAt.dateHijri) {
    return null;
  }

  const { year, month, day } = scheduleAt.dateHijri;
  const hijriOpts = { latitude: lat, longitude: lng, offset: offset ?? 0 };
  if (!!scheduleAt.time && !scheduleAt.time.includes(":")) {
    let d = new HijriDate(
      year,
      month,
      day,
      undefined,
      undefined,
      0,
      0,
      hijriOpts
    ).toDate();
    let prayerTimes = getPrayerTimeForDate(lat, lng, d);
    return (
      prayerTimes[scheduleAt.time.toLowerCase() as keyof PrayerTimes] as Date
    ).valueOf();
  }

  if (!!scheduleAt.time && scheduleAt.time.includes(":")) {
    const [h, m] = scheduleAt.time.split(":").map(Number);
    return new HijriDate(year, month, day, h, m, 0, 0, hijriOpts)
      .toDate()
      .valueOf();
  }

  return new HijriDate(year, month, day, undefined, undefined, 0, 0, hijriOpts)
    .endOfDay()
    .toDate()
    .valueOf();
}
