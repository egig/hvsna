import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import * as SunCalc from "suncalc";

// Jakarta coordinates (default location)
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

export class HijriMonth {
  year: number;
  month: number;
  _rawGregorianDate: Date;
  _latitude?: number;
  _longitude?: number;
  _offset?: number;

  constructor(
    year: number,
    month: number,
    latitude?: number,
    longitude?: number,
    offset?: number,
  ) {
    this.year = year;
    this.month = month;
    this._latitude = latitude;
    this._longitude = longitude;
    this._offset = offset;
    // Use the first day of the month for conversion
    let d = hijriToGregorian({ year, month, day: 1 });
    this._rawGregorianDate = new Date(d.year, d.month - 1, d.day);
  }

  previous(): HijriMonth {
    // Use the raw Gregorian date to calculate previous month
    // Subtract approximately 29 days to get to previous Hijri month
    const prevGregorianDate = new Date(this._rawGregorianDate);
    prevGregorianDate.setDate(prevGregorianDate.getDate() - 29);

    const hijriDate = gregorianToHijri({
      year: prevGregorianDate.getFullYear(),
      month: prevGregorianDate.getMonth() + 1,
      day: prevGregorianDate.getDate(),
    });

    return new HijriMonth(
      hijriDate.year,
      hijriDate.month,
      this._latitude,
      this._longitude,
      this._offset,
    );
  }

  next(): HijriMonth {
    // Use the raw Gregorian date to calculate next month
    // Add approximately 30 days to get to next Hijri month
    const nextGregorianDate = new Date(this._rawGregorianDate);
    nextGregorianDate.setDate(nextGregorianDate.getDate() + 30);

    const hijriDate = gregorianToHijri({
      year: nextGregorianDate.getFullYear(),
      month: nextGregorianDate.getMonth() + 1,
      day: nextGregorianDate.getDate(),
    });

    return new HijriMonth(
      hijriDate.year,
      hijriDate.month,
      this._latitude,
      this._longitude,
      this._offset,
    );
  }

  getDaysInMonth(): number {
    // Check different days to find the maximum valid day in this month
    let maxDay = 30;
    for (let day = 30; day >= 1; day--) {
      try {
        hijriToGregorian({ year: this.year, month: this.month, day });
        maxDay = day;
        break;
      } catch (error) {
        // Day is invalid, continue checking
      }
    }
    return maxDay;
  }

  getFirstDay(): HijriDate {
    // Create a Gregorian date for the first day of this Hijri month
    const d = HijriDate.hijriToJsDate(
      this.year,
      this.month,
      1,
      0,
      0,
      this._latitude,
      this._longitude,
      {
        offset: this._offset || 0,
      },
    );
    return HijriDate.fromDate(d, this._latitude, this._longitude, {
      offset: this._offset || 0,
    });
  }

  getLastDay(): HijriDate {
    const daysInMonth = this.getDaysInMonth();
    // Create a Gregorian date for the last day of this Hijri month
    const d = HijriDate.hijriToJsDate(
      this.year,
      this.month,
      daysInMonth,
      0,
      0,
      this._latitude,
      this._longitude,
      {
        offset: this._offset || 0,
      },
    );
    return HijriDate.fromDate(d, this._latitude, this._longitude, {
      offset: this._offset || 0,
    });
  }

  toString(): string {
    return `${this.year}-${this.month.toString().padStart(2, "0")}`;
  }

  equals(other: HijriMonth): boolean {
    return this.year === other.year && this.month === other.month;
  }

  /**
   * Create a HijriMonth from a JavaScript Date with location and offset support
   * @param date JavaScript Date object
   * @param latitude Latitude for sunset calculation (defaults to Jakarta)
   * @param longitude Longitude for sunset calculation (defaults to Jakarta)
   * @param options Optional configuration
   * @param options.offset Number of days to offset the date (positive for future, negative for past)
   * @returns HijriMonth instance
   */
  static fromDate(
    date: Date,
    latitude?: number,
    longitude?: number,
    options?: { offset?: number },
  ): HijriMonth {
    const lat = latitude ?? DEFAULT_LATITUDE;
    const lng = longitude ?? DEFAULT_LONGITUDE;
    const offset = options?.offset ?? 0;

    // Use HijriDate.fromDate to get accurate Hijri date with sunset calculation
    const hijriDate = HijriDate.fromDate(date, lat, lng, { offset });

    return new HijriMonth(hijriDate.year, hijriDate.month, lat, lng, offset);
  }

  /**
   * Get the current Hijri month with location and offset support
   * @param latitude Latitude for sunset calculation (defaults to Jakarta)
   * @param longitude Longitude for sunset calculation (defaults to Jakarta)
   * @param options Optional configuration
   * @param options.offset Number of days to offset the date (positive for future, negative for past)
   * @returns Current HijriMonth instance
   */
  static getCurrent(
    latitude?: number,
    longitude?: number,
    options?: { offset?: number },
  ): HijriMonth {
    return HijriMonth.fromDate(new Date(), latitude, longitude, options);
  }
}

// Import HijriDate for the getFirstDay and getLastDay methods
import { HijriDate } from "./hijri-date";
