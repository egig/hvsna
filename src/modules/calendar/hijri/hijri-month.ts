import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import * as SunCalc from "suncalc";
import { HijriDate } from "./hijri-date";
import type { HijriDateOptions } from "./hijri-date";
import { getDaysInMonth } from "./get-days-in-month";

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

  constructor(year: number, month: number, options?: HijriDateOptions) {
    this.year = year;
    this.month = month;
    // Store default values only when options is undefined, not when it's an empty object
    if (options) {
      this._latitude = options.latitude;
      this._longitude = options.longitude;
      this._offset = options.offset; // Keep undefined when not provided in empty object
    } else {
      this._latitude = DEFAULT_LATITUDE;
      this._longitude = DEFAULT_LONGITUDE;
      this._offset = 0;
    }
    this._rawGregorianDate = HijriDate.hijriToJsDate(
      year,
      month,
      1,
      0,
      0,
      options,
    );
  }

  previous(): HijriMonth {
    const prevGregorianDate = new Date(this._rawGregorianDate);
    prevGregorianDate.setDate(prevGregorianDate.getDate() - 29);

    const hijriDate = gregorianToHijri({
      year: prevGregorianDate.getFullYear(),
      month: prevGregorianDate.getMonth() + 1,
      day: prevGregorianDate.getDate(),
    });

    return new HijriMonth(hijriDate.year, hijriDate.month, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
    });
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

    return new HijriMonth(hijriDate.year, hijriDate.month, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
    });
  }

  getDaysInMonth(): number {
    return getDaysInMonth(this.year, this.month);
  }

  getFirstDay(): HijriDate {
    const d = HijriDate.hijriToJsDate(this.year, this.month, 1, 0, 0, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset || 0,
    });
    return HijriDate.fromDate(d, {
      latitude: this._latitude,
      longitude: this._longitude,
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
      {
        latitude: this._latitude,
        longitude: this._longitude,
        offset: this._offset || 0,
      },
    );
    return HijriDate.fromDate(d, {
      latitude: this._latitude,
      longitude: this._longitude,
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
   * @param options Optional configuration including latitude, longitude, and offset
   * @returns HijriMonth instance
   */
  static fromDate(date: Date, options?: HijriDateOptions): HijriMonth {
    // Use HijriDate.fromDate to get accurate Hijri date with sunset calculation
    const hijriDate = HijriDate.fromDate(date, options);

    return new HijriMonth(hijriDate.year, hijriDate.month, options);
  }

  /**
   * Get the current Hijri month with location and offset support
   * @param options Optional configuration including latitude, longitude, and offset
   * @returns Current HijriMonth instance
   */
  static getCurrent(options?: HijriDateOptions): HijriMonth {
    return HijriMonth.fromDate(new Date(), options);
  }
}
