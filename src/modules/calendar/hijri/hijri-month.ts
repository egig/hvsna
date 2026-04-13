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
  _jsDate: Date;
  _latitude?: number;
  _longitude?: number;
  _offset?: number;

  constructor(year: number, month: number, options?: HijriDateOptions) {
    this.year = year;
    this.month = month;
    // Only set defaults if options is undefined, not if it's an empty object
    if (options === undefined) {
      this._latitude = DEFAULT_LATITUDE;
      this._longitude = DEFAULT_LONGITUDE;
      this._offset = 0;
    } else {
      this._latitude = options.latitude;
      this._longitude = options.longitude;
      this._offset = options.offset;
    }
    let d = new HijriDate(
      year,
      month,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      options
    );
    this._jsDate = d.toDate();
  }

  previous(): HijriMonth {
    let prevYear = this.year;
    let prevMonth = this.month - 1;

    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    return new HijriMonth(prevYear, prevMonth, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
    });
  }

  next(): HijriMonth {
    let nextYear = this.year;
    let nextMonth = this.month + 1;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    return new HijriMonth(nextYear, nextMonth, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
    });
  }

  getDaysInMonth(): number {
    return getDaysInMonth(this.year, this.month);
  }

  getFirstDay(): HijriDate {
    return new HijriDate(this.year, this.month, 1, 0, 0, 0, 0, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset || 0,
    });
  }

  getLastDay(): HijriDate {
    const daysInMonth = this.getDaysInMonth();
    return new HijriDate(this.year, this.month, daysInMonth, 0, 0, 0, 0, {
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
