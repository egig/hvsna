import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getDaysInMonth } from "./get-days-in-month";
import { fromDate as standaloneFromDate } from "./from-date";
import * as SunCalc from "suncalc";

// Jakarta coordinates (default location)
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

/**
 * Options for HijriDate calculations
 */
export interface HijriDateOptions {
  latitude?: number;
  longitude?: number;
  offset?: number;
  jsDate?: Date;
  startOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
}

/**
 * Applies day offset to Hijri date components, handling month/year overflow/underflow
 * @param year - Hijri year
 * @param month - Hijri month (1-12)
 * @param day - Hijri day
 * @param offset - Number of days to adjust (positive = subtract days, negative = add days)
 * @returns Adjusted Hijri date components
 */
function applyHijriDateOffset(
  year: number,
  month: number,
  day: number,
  offset: number,
): { year: number; month: number; day: number } {
  let adjustedYear = year;
  let adjustedMonth = month;
  let adjustedDay = day;

  if (offset !== 0) {
    adjustedDay = day + offset;

    // Handle day overflow/underflow
    while (adjustedDay > getDaysInMonth(adjustedYear, adjustedMonth)) {
      adjustedDay -= getDaysInMonth(adjustedYear, adjustedMonth);
      adjustedMonth++;
      if (adjustedMonth > 12) {
        adjustedMonth = 1;
        adjustedYear++;
      }
    }

    while (adjustedDay < 1) {
      adjustedDay += getDaysInMonth(adjustedYear, adjustedMonth - 1);
      adjustedMonth--;
      if (adjustedMonth < 1) {
        adjustedMonth = 12;
        adjustedYear--;
      }
    }
  }

  return { year: adjustedYear, month: adjustedMonth, day: adjustedDay };
}

export class HijriDate {
  year!: number;
  month!: number;
  day!: number;
  dayOfWeek!: number;
  hour!: number;
  minute!: number;
  _rawGregorianDate!: Date;
  _latitude?: number;
  _longitude?: number;
  _offset?: number;
  _startOfWeek?: number;

  constructor(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    options: HijriDateOptions,
  ) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    ((this._rawGregorianDate = options.jsDate as Date),
      (this._latitude = options.latitude),
      (this._longitude = options.longitude),
      (this._offset = options.offset),
      (this._startOfWeek = options.startOfWeek ?? 5)); // Default to Friday (5) for Islamic calendar

    this.dayOfWeek = this._rawGregorianDate.getDay();
    // Adjust dayOfWeek based on startOfWeek setting
    // If startOfWeek is Sunday (0), dayOfWeek remains 0-6 (Sun-Sat)
    // If startOfWeek is Monday (1), dayOfWeek becomes 0-6 (Mon-Sun)
    // If startOfWeek is Friday (5), dayOfWeek becomes 0-6 (Fri-Thu)
    const startOfWeekDay = this._startOfWeek ?? 5; // Default to Friday (5) for Islamic calendar
    this.dayOfWeek = (this.dayOfWeek - startOfWeekDay + 7) % 7;
  }

  toDate(): Date {
    return this._rawGregorianDate;
  }

  /**
   * Advance Hijri date by a specified number of days without sunset logic
   * @param days Number of days to advance (can be negative)
   */
  advanceDays(days: number): void {
    const {
      year: adjustedYear,
      month: adjustedMonth,
      day: adjustedDay,
    } = applyHijriDateOffset(this.year, this.month, this.day, days);

    this.year = adjustedYear;
    this.month = adjustedMonth;
    this.day = adjustedDay;
  }

  /**
   * Advance to next Hijri day if the original time was after sunset
   * Used for perfect symmetry with toDate() method
   * @param originalDate The original Gregorian date to check against sunset
   * @param lat Latitude for sunset calculation
   * @param lng Longitude for sunset calculation
   */
  advanceDayIfAfterSunset(originalDate: Date, lat: number, lng: number): void {
    try {
      const times = SunCalc.getTimes(originalDate, lat, lng);
      const sunset = times.sunset;

      if (sunset && originalDate >= sunset) {
        // Advance to next Hijri day
        let shiftDay = 1;
        this.advanceDays(shiftDay);
        this.dayOfWeek = (this.dayOfWeek + shiftDay + 7) % 7;
      }
    } catch (error) {
      console.warn(
        "SunCalc calculation failed in advanceDayIfAfterSunset:",
        error,
      );
    }
  }

  /**
   * Create a HijriDate instance with all properties initialized
   * @param year Hijri year
   * @param month Hijri month (1-12)
   * @returns Number of days in the month (29 or 30)
   */
  static getDaysInMonth(year: number, month: number): number {
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

  /**
   * Convert Hijri date components to JavaScript Date object with sunset calculation
   * @param year Hijri year
   * @param month Hijri month (1-12)
   * @param day Hijri day
   * @param hour Hour (0-23, defaults to sunset time if not provided)
   * @param minute Minute (0-59, defaults to sunset time if not provided)
   * @param options Optional configuration including latitude, longitude, and offset
   * @returns JavaScript Date object
   */
  static hijriToJsDate(
    year: number,
    month: number,
    day: number,
    hour?: number,
    minute?: number,
    options?: HijriDateOptions,
  ): Date {
    const lat = options?.latitude ?? DEFAULT_LATITUDE;
    const lng = options?.longitude ?? DEFAULT_LONGITUDE;
    const offset = options?.offset ?? 0;

    // Reverse logic: subtract offset instead of add so we times offset with -1
    const {
      year: adjustedYear,
      month: adjustedMonth,
      day: adjustedDay,
    } = applyHijriDateOffset(year, month, day, -1 * offset);

    const gregorian = hijriToGregorian({
      year: adjustedYear,
      month: adjustedMonth,
      day: adjustedDay,
    });

    if (hour === undefined || minute === undefined) {
      const startOfDay = HijriDate.startOfDayInJsDate(
        adjustedYear,
        adjustedMonth,
        adjustedDay,
        { latitude: lat, longitude: lng },
      );
      return startOfDay;
    }

    let result = new Date(
      gregorian.year,
      gregorian.month - 1,
      gregorian.day,
      hour,
      minute,
      0,
      0,
    );

    try {
      const times = SunCalc.getTimes(result, lat, lng);
      const sunset = times.sunset;

      // If the time is after sunset, the Hijri date has already changed to the next day
      // So we need to adjust the Gregorian date to the previous day to match the Hijri date
      if (sunset && result >= sunset) {
        // Move to previous day because evening belongs to next Hijri day
        const previousDay = new Date(result);
        previousDay.setDate(previousDay.getDate() - 1);
        result = previousDay;
      }
    } catch (error) {
      // If SunCalc fails (e.g., invalid coordinates), fall back to original date
      console.warn("SunCalc calculation failed in hijriToJsDate:", error);
    }

    return result;
  }

  static fromDate(date: Date, options?: HijriDateOptions): HijriDate {
    return standaloneFromDate(date, options);
  }

  previous(): HijriDate {
    const prevGregorian = new Date(this._rawGregorianDate);
    prevGregorian.setDate(prevGregorian.getDate() - 1);

    return standaloneFromDate(prevGregorian, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
  }

  next(): HijriDate {
    const nextGregorian = new Date(this._rawGregorianDate);
    nextGregorian.setDate(nextGregorian.getDate() + 1);

    return standaloneFromDate(nextGregorian, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
  }

  startOfWeek(): HijriDate {
    // Get the raw JavaScript day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
    const rawDayOfWeek = this._rawGregorianDate.getDay();
    const startOfWeekDay = this._startOfWeek ?? 5; // Default to Friday (5) for Islamic calendar

    // Calculate days to subtract to get to the start of week
    let daysToSubtract;
    if (rawDayOfWeek >= startOfWeekDay) {
      // Current day is on or after start of week
      daysToSubtract = rawDayOfWeek - startOfWeekDay;
    } else {
      // Current day is before start of week, go back to previous week
      daysToSubtract = rawDayOfWeek + (7 - startOfWeekDay);
    }

    const startOfWeekGregorian = new Date(this._rawGregorianDate);
    startOfWeekGregorian.setDate(
      startOfWeekGregorian.getDate() - daysToSubtract,
    );

    return standaloneFromDate(startOfWeekGregorian, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
  }

  format(formatString: string): string {
    const hijriMonthNames = [
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

    const hijriMonthShortNames = [
      "Muh",
      "Saf",
      "Rab1",
      "Rab2",
      "Jum1",
      "Jum2",
      "Raj",
      "Sha",
      "Ram",
      "Shw",
      "DhuQ",
      "DhuH",
    ];

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dayOfWeek = this._rawGregorianDate.getDay();
    const hours = this._rawGregorianDate.getHours();
    const minutes = this._rawGregorianDate.getMinutes();
    const seconds = this._rawGregorianDate.getSeconds();

    let result = formatString;

    // Replace exact token patterns (not word boundaries for time tokens)
    result = result.replace(/YYYY/g, this.year.toString());
    result = result.replace(/MMMM/g, hijriMonthNames[this.month - 1]);
    result = result.replace(/DDDD/g, this.getDayWithSuffix());
    result = result.replace(/dddd/g, dayNames[dayOfWeek]);
    result = result.replace(/Do/g, this.getDayWithSuffix());
    result = result.replace(/MMM/g, hijriMonthShortNames[this.month - 1]);
    result = result.replace(/ddd/g, dayShortNames[dayOfWeek]);
    result = result.replace(/YY/g, this.year.toString().slice(-2));
    result = result.replace(/MM/g, this.month.toString().padStart(2, "0"));
    result = result.replace(/DD/g, this.day.toString().padStart(2, "0"));
    result = result.replace(/HH/g, hours.toString().padStart(2, "0"));
    result = result.replace(/mm/g, minutes.toString().padStart(2, "0"));
    result = result.replace(/ss/g, seconds.toString().padStart(2, "0"));

    // Replace single character tokens only when they stand alone
    result = result.replace(/\bM\b/g, this.month.toString());
    result = result.replace(/\bD\b/g, this.day.toString());
    result = result.replace(/\bH\b/g, hours.toString());
    result = result.replace(/\bh\b/g, (hours % 12 || 12).toString());
    result = result.replace(/\bm\b/g, minutes.toString());
    result = result.replace(/\bs\b/g, seconds.toString());
    result = result.replace(/\ba\b/g, hours < 12 ? "am" : "pm");
    result = result.replace(/\bA\b/g, hours < 12 ? "AM" : "PM");
    result = result.replace(/\bdd\b/g, dayShortNames[dayOfWeek]);

    return result;
  }

  private getDayWithSuffix(): string {
    const day = this.day;
    if (day >= 11 && day <= 13) {
      return day + "th";
    }
    switch (day % 10) {
      case 1:
        return day + "st";
      case 2:
        return day + "nd";
      case 3:
        return day + "rd";
      default:
        return day + "th";
    }
  }

  isToday(): boolean {
    // Use Jakarta coordinates as default if not available
    const lat = this._latitude ?? DEFAULT_LATITUDE;
    const lng = this._longitude ?? DEFAULT_LONGITUDE;

    const today = standaloneFromDate(new Date(), {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
    return (
      this.year === today.year &&
      this.month === today.month &&
      this.day === today.day
    );
  }

  isTomorrow(): boolean {
    const lat = this._latitude ?? DEFAULT_LATITUDE;
    const lng = this._longitude ?? DEFAULT_LONGITUDE;

    const tomorrow = standaloneFromDate(new Date(Date.now() + 86400000), {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
    return (
      this.year === tomorrow.year &&
      this.month === tomorrow.month &&
      this.day === tomorrow.day
    );
  }

  getWeekDates(): HijriDate[] {
    const sow = this.startOfWeek();
    const weekDates = [sow];
    for (let i = 0; i < 6; i++) {
      weekDates.push(weekDates[i].next());
    }
    return weekDates;
  }

  /**
   * Get the start of the Hijri day in JavaScript Date format (static version)
   * @param year Hijri year
   * @param month Hijri month (1-12)
   * @param day Hijri day
   * @param options Optional configuration including latitude and longitude
   * @returns JavaScript Date object representing the start of the Hijri day (sunset time)
   */
  static startOfDayInJsDate(
    year: number,
    month: number,
    day: number,
    options?: HijriDateOptions,
  ): Date {
    // Use Jakarta coordinates as default if not provided
    const lat = options?.latitude ?? DEFAULT_LATITUDE;
    const lng = options?.longitude ?? DEFAULT_LONGITUDE;

    // Convert Hijri date to Gregorian date
    const gregorian = hijriToGregorian({
      year,
      month,
      day,
    });

    // Create a date object at noon for sunset calculation
    const noonDate = new Date(
      gregorian.year,
      gregorian.month - 1,
      gregorian.day - 1, // start of day always the day before
      12,
      0,
      0,
      0,
    );

    try {
      // Get sunset time for this date
      const times = SunCalc.getTimes(noonDate, lat, lng);
      const sunset = times.sunset;

      if (sunset && !isNaN(sunset.getTime())) {
        return sunset;
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in startOfDay:", error);
    }

    // Fallback to midnight if sunset calculation fails
    return new Date(
      gregorian.year,
      gregorian.month - 1,
      gregorian.day,
      0,
      0,
      0,
      0,
    );
  }

  /**
   * Get the start of the Hijri day in JavaScript Date format
   * @returns JavaScript Date object representing the start of the Hijri day (sunset time)
   */
  startOfDay(): HijriDate {
    // Use Jakarta coordinates as default if not available
    const lat = this._latitude ?? DEFAULT_LATITUDE;
    const lng = this._longitude ?? DEFAULT_LONGITUDE;

    // Delegate to static method
    return standaloneFromDate(
      HijriDate.startOfDayInJsDate(this.year, this.month, this.day, {
        latitude: this._latitude,
        longitude: this._longitude,
      }),
      {
        latitude: this._latitude,
        longitude: this._longitude,
        offset: this._offset,
        startOfWeek: this._startOfWeek,
      },
    );
  }
}

export function isTodayHijriDate(hijriDate: HijriDate): boolean {
  // Use Jakarta coordinates as default if not available
  const lat = hijriDate._latitude ?? DEFAULT_LATITUDE;
  const lng = hijriDate._longitude ?? DEFAULT_LONGITUDE;

  const today = standaloneFromDate(new Date(), {
    latitude: hijriDate._latitude,
    longitude: hijriDate._longitude,
    offset: hijriDate._offset,
    startOfWeek: hijriDate._startOfWeek,
  });
  return (
    hijriDate.year === today.year &&
    hijriDate.month === today.month &&
    hijriDate.day === today.day
  );
}

export function isSameHijriDate(date1: HijriDate, date2: HijriDate): boolean {
  return (
    date1.year === date2.year &&
    date1.month === date2.month &&
    date1.day === date2.day
  );
}

/**
 * Get sunset time for a specific date and location
 */
export function getSunsetTime(
  date: Date,
  latitude: number,
  longitude: number,
): Date | null {
  try {
    const times = SunCalc.getTimes(date, latitude, longitude);
    const sunset = times.sunset;

    // Check if sunset is a valid date
    if (!sunset || isNaN(sunset.getTime())) {
      return null;
    }

    return sunset;
  } catch (error) {
    console.warn("SunCalc calculation failed:", error);
    return null;
  }
}

/**
 * Check if current time is after sunset for given location
 */
export function isAfterSunset(
  date: Date,
  latitude: number,
  longitude: number,
): boolean {
  const sunset = getSunsetTime(date, latitude, longitude);
  return sunset ? date >= sunset : false;
}
