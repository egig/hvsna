import { HijriDate } from "./hijri-date";
import type { HijriDateOptions } from "./hijri-date";
import { getDaysInMonth } from "./get-days-in-month";

export class HijriMonth {
  year: number;
  month: number;
  _jsDate: Date;
  _latitude: number;
  _longitude: number;
  _offset?: number;

  constructor(
    lat: number,
    lng: number,
    year: number,
    month: number,
    options: HijriDateOptions
  ) {
    this.year = year;
    this.month = month;

    this._latitude = lat;
    this._longitude = lng;
    this._offset = options.offset;

    let d = new HijriDate(
      lat,
      lng,
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

    return new HijriMonth(
      this._latitude,
      this._longitude,
      prevYear,
      prevMonth,
      {
        offset: this._offset,
      }
    );
  }

  next(): HijriMonth {
    let nextYear = this.year;
    let nextMonth = this.month + 1;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    return new HijriMonth(
      this._latitude,
      this._longitude,
      nextYear,
      nextMonth,
      {
        offset: this._offset,
      }
    );
  }

  getDaysInMonth(): number {
    return getDaysInMonth(this.year, this.month);
  }

  getFirstDay(): HijriDate {
    return new HijriDate(
      this._latitude,
      this._longitude,
      this.year,
      this.month,
      1,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        offset: this._offset || 0,
      }
    );
  }

  getLastDay(): HijriDate {
    const daysInMonth = this.getDaysInMonth();
    return new HijriDate(
      this._latitude,
      this._longitude,
      this.year,
      this.month,
      daysInMonth,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        offset: this._offset || 0,
      }
    );
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
  static fromDate(
    lat: number,
    lng: number,
    date: Date,
    options: HijriDateOptions
  ): HijriMonth {
    const hijriDate = HijriDate.fromDate(lat, lng, date, options);
    return new HijriMonth(lat, lng, hijriDate.year, hijriDate.month, options);
  }

  /**
   * Get the current Hijri month with location and offset support
   * @param options Optional configuration including latitude, longitude, and offset
   * @returns Current HijriMonth instance
   */
  static getCurrent(
    lat: number,
    lng: number,
    options: HijriDateOptions
  ): HijriMonth {
    return HijriMonth.fromDate(lat, lng, new Date(), options);
  }
}
