import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import * as SunCalc from "suncalc";

// Jakarta coordinates (default location)
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

/**
 * Interface for Hijri date components
 */
export interface HijriDateComponents {
  year: number;
  month: number;
  day: number;
}

/**
 * Interface for time components
 */
export interface TimeComponents {
  hour: number;
  minute: number;
}

/**
 * Options for date conversion
 */
export interface ConversionOptions {
  latitude?: number;
  longitude?: number;
  offset?: number;
}

/**
 * Converts Hijri date and time to Gregorian date with sunset and offset logic
 *
 * @param hijriDate - Hijri date components (year, month, day)
 * @param hijriTime - Hijri time components (hour, minute)
 * @param options - Conversion options (latitude, longitude, offset)
 * @returns Gregorian Date object
 */
export function toDate(
  hijriDate: HijriDateComponents,
  hijriTime: TimeComponents,
  options?: ConversionOptions,
): Date {
  const latitude = options?.latitude ?? DEFAULT_LATITUDE;
  const longitude = options?.longitude ?? DEFAULT_LONGITUDE;
  const offset = options?.offset ?? 0;

  const adjustedHijri = _applyOffset(hijriDate, -1 * offset);

  const gregorian = hijriToGregorian(adjustedHijri);
  let gregorianDate = new Date(
    gregorian.year,
    gregorian.month - 1,
    gregorian.day,
  );

  const sunsetTime = getSunsetTime(gregorianDate, latitude, longitude);
  if (isTimeAfter(hijriTime, sunsetTime)) {
    gregorianDate.setDate(gregorianDate.getDate() - 1);
  }
  const result = new Date(gregorianDate);
  result.setHours(hijriTime.hour, hijriTime.minute, 0, 0);

  return result;
}

/**
 * Converts Gregorian date and time to Hijri date with sunset and offset logic
 *
 * @param gregorianDate - Gregorian Date object
 * @param gregorianTime - Gregorian time components (hour, minute)
 * @param options - Conversion options (latitude, longitude, offset)
 * @returns Hijri date components
 */
export function fromDate(
  gregorianDate: Date,
  options?: ConversionOptions,
): HijriDateComponents {
  const latitude = options?.latitude ?? DEFAULT_LATITUDE;
  const longitude = options?.longitude ?? DEFAULT_LONGITUDE;
  const offset = options?.offset ?? 0;

  const workingDate = new Date(gregorianDate);
  let hijriDate = gregorianToHijri({
    year: workingDate.getFullYear(),
    month: workingDate.getMonth() + 1, // JavaScript months are 0-based
    day: workingDate.getDate(),
  });

  const sunsetTime = getSunsetTime(workingDate, latitude, longitude);
  if (
    isTimeAfter(
      {
        hour: gregorianDate.getHours(),
        minute: gregorianDate.getMinutes(),
      },
      sunsetTime,
    )
  ) {
    hijriDate = _applyOffset(hijriDate, 1);
  }

  const adjustedHijri = _applyOffset(hijriDate, offset);
  return adjustedHijri;
}

/**
 * Gets sunset time for a specific date and location
 */
function getSunsetTime(
  date: Date,
  latitude: number,
  longitude: number,
): TimeComponents | null {
  try {
    const times = SunCalc.getTimes(date, latitude, longitude);
    const sunset = times.sunset;

    if (!sunset || isNaN(sunset.getTime())) {
      return null;
    }

    return {
      hour: sunset.getHours(),
      minute: sunset.getMinutes(),
    };
  } catch (error) {
    console.warn("SunCalc calculation failed:", error);
    return null;
  }
}

/**
 * Checks if a given time is after sunset time
 */
function isTimeAfter(
  time: TimeComponents,
  sunsetTime: TimeComponents | null,
): boolean {
  if (!sunsetTime) {
    return false;
  }

  if (time.hour > sunsetTime.hour) {
    return true;
  }

  if (time.hour === sunsetTime.hour && time.minute > sunsetTime.minute) {
    return true;
  }

  return false;
}

function _applyOffset(
  d: HijriDateComponents,
  offset: number,
): { year: number; month: number; day: number } {
  let adjustedYear = d.year;
  let adjustedMonth = d.month;
  let adjustedDay = d.day;

  if (offset !== 0) {
    adjustedDay = d.day + offset;

    // Handle day overflow/underflow
    while (adjustedDay > _daysInMonth(adjustedYear, adjustedMonth)) {
      adjustedDay -= _daysInMonth(adjustedYear, adjustedMonth);
      adjustedMonth++;
      if (adjustedMonth > 12) {
        adjustedMonth = 1;
        adjustedYear++;
      }
    }

    while (adjustedDay < 1) {
      adjustedDay += _daysInMonth(adjustedYear, adjustedMonth - 1);
      adjustedMonth--;
      if (adjustedMonth < 1) {
        adjustedMonth = 12;
        adjustedYear--;
      }
    }
  }

  return { year: adjustedYear, month: adjustedMonth, day: adjustedDay };
}

export function _daysInMonth(year: number, month: number): number {
  // Check different days to find the maximum valid day in this month
  let maxDay = 30;
  for (let day = 30; day >= 1; day--) {
    try {
      hijriToGregorian({ year, month, day });
      maxDay = day;
      break;
    } catch (error) {
      // Day is invalid, continue checking
    }
  }
  return maxDay;
}
