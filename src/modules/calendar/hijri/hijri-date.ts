import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import * as SunCalc from "suncalc";

const Days = ["fri", "sat", "sun", "mon", "tue", "wed", "thu"];

// Jakarta coordinates (default location)
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

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

  private constructor() {}

  toDate(): Date {
    // Convert Hijri date back to Gregorian
    const gregorian = hijriToGregorian({
      year: this.year,
      month: this.month,
      day: this.day,
    });

    // Create Date object with the converted Gregorian date
    const result = new Date(gregorian.year, gregorian.month - 1, gregorian.day);

    // Set the time components
    result.setHours(this.hour, this.minute, 0, 0);

    // Use Jakarta coordinates as default if not available
    const lat = this._latitude ?? DEFAULT_LATITUDE;
    const lng = this._longitude ?? DEFAULT_LONGITUDE;

    // Reverse the sunset adjustment logic
    // If the original time was after sunset, we need to subtract one day
    // to get back to the original Gregorian date
    try {
      const times = SunCalc.getTimes(result, lat, lng);
      const sunset = times.sunset;

      if (sunset && result >= sunset) {
        // The current time is after sunset, so we need to go back one day
        // to get the original Gregorian date that was used in fromDate
        result.setDate(result.getDate() - 1);
        // Preserve the time components
        result.setHours(this.hour, this.minute, 0, 0);
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in toDate:", error);
    }

    return result;
  }

  /**
   * Convert Hijri date components to JavaScript Date object with sunset calculation
   * @param year Hijri year
   * @param month Hijri month (1-12)
   * @param day Hijri day
   * @param hour Hour (0-23, defaults to 0)
   * @param minute Minute (0-59, defaults to 0)
   * @param latitude Latitude for sunset calculation (defaults to Jakarta)
   * @param longitude Longitude for sunset calculation (defaults to Jakarta)
   * @returns JavaScript Date object
   */
  static hijriToJsDate(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    latitude?: number,
    longitude?: number,
  ): Date {
    // Use Jakarta coordinates as default if not provided
    const lat = latitude ?? DEFAULT_LATITUDE;
    const lng = longitude ?? DEFAULT_LONGITUDE;

    // Convert Hijri date to Gregorian date
    const gregorian = hijriToGregorian({ year, month, day });

    // Create Date object with time components
    const result = new Date(
      gregorian.year,
      gregorian.month - 1,
      gregorian.day,
      hour,
      minute,
      0,
      0,
    );

    // Apply sunset adjustment logic (same as in fromDate)
    try {
      const times = SunCalc.getTimes(result, lat, lng);
      const sunset = times.sunset;

      // If the time is after sunset, the Hijri date has already changed to the next day
      // So we need to adjust the Gregorian date to the previous day to match the Hijri date
      if (sunset && result >= sunset) {
        // Move to previous day because evening belongs to next Hijri day
        const previousDay = new Date(result);
        previousDay.setDate(previousDay.getDate() - 1);
        return previousDay;
      }
    } catch (error) {
      // If SunCalc fails (e.g., invalid coordinates), fall back to original date
      console.warn("SunCalc calculation failed in hijriToJsDate:", error);
    }

    return result;
  }

  static fromDate(date: Date, latitude?: number, longitude?: number) {
    // Use Jakarta coordinates as default if not provided
    const lat = latitude ?? DEFAULT_LATITUDE;
    const lng = longitude ?? DEFAULT_LONGITUDE;

    let referenceDate = date; // Always preserve the original timestamp
    let hijriDate = gregorianToHijri({
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Month number in Javascript Date API is zero-based.
      day: date.getDate(),
    });

    // If the original time was after sunset, we need to advance to the next Hijri day
    // but keep the original timestamp for perfect symmetry with toDate()
    try {
      const times = SunCalc.getTimes(date, lat, lng);
      const sunset = times.sunset;

      if (sunset && date >= sunset) {
        // Advance to next Hijri day
        const nextHijri = hijriDate.day + 1;
        const maxDaysInMonth = 30; // Simplified - should get actual month length

        if (nextHijri > maxDaysInMonth) {
          // Move to next month
          hijriDate.day = 1;
          hijriDate.month += 1;
          if (hijriDate.month > 12) {
            hijriDate.month = 1;
            hijriDate.year += 1;
          }
        } else {
          hijriDate.day = nextHijri;
        }

        // Keep the original timestamp for perfect symmetry
        // referenceDate remains the original date
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in fromDate:", error);
    }

    // Create HijriDate instance directly
    const hijriDateObj = Object.create(HijriDate.prototype);
    hijriDateObj.year = hijriDate.year;
    hijriDateObj.month = hijriDate.month;
    hijriDateObj.day = hijriDate.day;
    hijriDateObj.hour = date.getHours();
    hijriDateObj.minute = date.getMinutes();
    hijriDateObj._latitude = lat;
    hijriDateObj._longitude = lng;
    hijriDateObj._rawGregorianDate = referenceDate;

    // Calculate day of week
    const Days = ["fri", "sat", "sun", "mon", "tue", "wed", "thu"];
    hijriDateObj.dayOfWeek = Days.indexOf(
      hijriDateObj.format("dd").toLowerCase(),
    );

    return hijriDateObj;
  }

  previous(): HijriDate {
    const prevGregorian = new Date(this._rawGregorianDate);
    prevGregorian.setDate(prevGregorian.getDate() - 1);

    return HijriDate.fromDate(prevGregorian, this._latitude, this._longitude);
  }

  next(): HijriDate {
    const nextGregorian = new Date(this._rawGregorianDate);
    nextGregorian.setDate(nextGregorian.getDate() + 1);

    return HijriDate.fromDate(nextGregorian, this._latitude, this._longitude);
  }

  startOfWeek(): HijriDate {
    // Get the day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
    // For Islamic calendar, Friday (day 5) is the start of the week
    const dayOfWeek = this._rawGregorianDate.getDay();

    // Calculate days to subtract to get to Friday
    // If it's Friday (5), subtract 0 days
    // If it's Saturday (6), subtract 1 day
    // If it's Sunday (0), subtract 2 days
    // If it's Monday (1), subtract 3 days
    // If it's Tuesday (2), subtract 4 days
    // If it's Wednesday (3), subtract 5 days
    // If it's Thursday (4), subtract 6 days
    let daysToSubtract;
    if (dayOfWeek === 5) {
      // Friday
      daysToSubtract = 0;
    } else if (dayOfWeek === 6) {
      // Saturday
      daysToSubtract = 1;
    } else {
      // Sunday through Thursday
      daysToSubtract = dayOfWeek + 2;
    }

    const startOfWeekGregorian = new Date(this._rawGregorianDate);
    startOfWeekGregorian.setDate(
      startOfWeekGregorian.getDate() - daysToSubtract,
    );

    return HijriDate.fromDate(
      startOfWeekGregorian,
      this._latitude,
      this._longitude,
    );
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

    const today = HijriDate.fromDate(new Date(), lat, lng);
    return (
      this.year === today.year &&
      this.month === today.month &&
      this.day === today.day
    );
  }

  isTomorrow(): boolean {
    const lat = this._latitude ?? DEFAULT_LATITUDE;
    const lng = this._longitude ?? DEFAULT_LONGITUDE;

    const tomorrow = HijriDate.fromDate(
      new Date(Date.now() + 86400000),
      lat,
      lng,
    );
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
}

export function isTodayHijriDate(hijriDate: HijriDate): boolean {
  // Use Jakarta coordinates as default if not available
  const lat = hijriDate._latitude ?? DEFAULT_LATITUDE;
  const lng = hijriDate._longitude ?? DEFAULT_LONGITUDE;

  const today = HijriDate.fromDate(new Date(), lat, lng);
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
