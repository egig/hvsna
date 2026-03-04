import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getDaysInMonth } from "./get-days-in-month";
import * as SunCalc from "suncalc";
import { fromDate, toDate } from "./core";

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
  startOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  sunsetShift?: number;
}

export class HijriDate {
  year!: number;
  month!: number;
  day!: number;
  dayOfWeek!: number;
  hour!: number;
  minute!: number;
  second!: number;
  millisecond!: number;
  _input!: {
    year: number;
    month: number;
    day: number;
  };
  _jsDate!: Date;
  _latitude: number;
  _longitude: number;
  _offset?: number;
  _startOfWeek?: number;
  _sunsetShift?: number;

  constructor(
    year: number,
    month: number,
    day: number,
    hour?: number,
    minute?: number,
    second?: number,
    millisecond?: number,
    options?: HijriDateOptions,
  ) {
    this._latitude = options?.latitude || DEFAULT_LATITUDE;
    this._longitude = options?.longitude || DEFAULT_LONGITUDE;
    this._offset = options?.offset || 0;
    this._startOfWeek = options?.startOfWeek ?? 5; // Default to Friday (5) for Islamic calendar

    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour as number;
    this.minute = minute as number;
    this.second = second as number;
    this.millisecond = millisecond as number;
    this._jsDate = toDate(
      {
        year,
        month,
        day,
      },
      { hour, minute, second, millisecond },
      {
        latitude: this._latitude,
        longitude: this._longitude,
        offset: this._offset,
      },
    );

    this.dayOfWeek = this._jsDate.getDay();
    // Adjust dayOfWeek based on startOfWeek setting
    // If startOfWeek is Sunday (0), dayOfWeek remains 0-6 (Sun-Sat)
    // If startOfWeek is Monday (1), dayOfWeek becomes 0-6 (Mon-Sun)
    // If startOfWeek is Friday (5), dayOfWeek becomes 0-6 (Fri-Thu)
    const startOfWeekDay = this._startOfWeek ?? 5; // Default to Friday (5) for Islamic calendar
    this.dayOfWeek =
      (this.dayOfWeek - startOfWeekDay + 7 + (options?.sunsetShift || 0)) % 7;
  }

  static fromDate(date: Date, options?: HijriDateOptions): HijriDate {
    let h = fromDate(date, options);
    const hijriDateObj = new HijriDate(
      h.year,
      h.month,
      h.day,
      h.hour,
      h.minute,
      h.second,
      h.millisecond,
      {
        latitude: options?.latitude,
        longitude: options?.longitude,
        offset: options?.offset,
        startOfWeek: options?.startOfWeek,
        sunsetShift: h.sunsetShift,
      },
    );

    return hijriDateObj;
  }

  toDate(): Date {
    return this._jsDate;
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

  previous(): HijriDate {
    const prevGregorian = new Date(this._jsDate);
    prevGregorian.setDate(prevGregorian.getDate() - 1);

    return HijriDate.fromDate(prevGregorian, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
  }

  next(): HijriDate {
    const nextGregorian = new Date(this._jsDate);
    nextGregorian.setDate(nextGregorian.getDate() + 1);

    return HijriDate.fromDate(nextGregorian, {
      latitude: this._latitude,
      longitude: this._longitude,
      offset: this._offset,
      startOfWeek: this._startOfWeek,
    });
  }

  startOfWeek(): HijriDate {
    // Get the raw JavaScript day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
    const rawDayOfWeek = this._jsDate.getDay();
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

    const startOfWeekGregorian = new Date(this._jsDate);
    startOfWeekGregorian.setDate(
      startOfWeekGregorian.getDate() - daysToSubtract,
    );

    return HijriDate.fromDate(startOfWeekGregorian, {
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

    const dayOfWeek = this._jsDate.getDay();
    const hours = this._jsDate.getHours();
    const minutes = this._jsDate.getMinutes();
    const seconds = this._jsDate.getSeconds();
    const milliseconds = this._jsDate.getMilliseconds();

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
    result = result.replace(/SSS/g, milliseconds.toString().padStart(3, "0"));

    // Replace single character tokens only when they stand alone
    result = result.replace(/\bM\b/g, this.month.toString());
    result = result.replace(/\bD\b/g, this.day.toString());
    result = result.replace(/\bH\b/g, hours.toString());
    result = result.replace(/\bh\b/g, (hours % 12 || 12).toString());
    result = result.replace(/\bm\b/g, minutes.toString());
    result = result.replace(/\bs\b/g, seconds.toString());
    result = result.replace(/\bS\b/g, milliseconds.toString());
    result = result.replace(/\ba\b/g, hours < 12 ? "am" : "pm");
    result = result.replace(/\bA\b/g, hours < 12 ? "AM" : "PM");
    result = result.replace(/\bdd\b/g, dayShortNames[dayOfWeek]);

    return result;
  }

  toString(): string {
    return this.format("YYYY-MM-DD");
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
    const today = HijriDate.fromDate(new Date(), {
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
    const tomorrow = HijriDate.fromDate(new Date(Date.now() + 86400000), {
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

  startOfDay(): HijriDate {
    try {
      const times = SunCalc.getTimes(
        this._jsDate,
        this._latitude as number,
        this._longitude as number,
      );
      const sunset = times.sunset;

      if (sunset && !isNaN(sunset.getTime())) {
        return new HijriDate(
          this.year,
          this.month,
          this.day,
          sunset.getHours(),
          sunset.getMinutes(),
          sunset.getSeconds(),
          sunset.getMilliseconds(),
          {
            latitude: this._latitude,
            longitude: this._longitude,
            offset: this._offset,
          },
        );
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in startOfDay:", error);
    }
    return this;
  }

  endOfDay(): HijriDate {
    try {
      const nextDay = this.next();
      const times = SunCalc.getTimes(
        nextDay._jsDate,
        nextDay._latitude as number,
        nextDay._longitude as number,
      );
      const sunset = times.sunset;

      if (sunset && !isNaN(sunset.getTime())) {
        // Subtract one second from the next day's sunset for precise end of day
        const endTime = new Date(sunset.getTime() - 1000);
        return new HijriDate(
          this.year,
          this.month,
          this.day,
          endTime.getHours(),
          endTime.getMinutes(),
          endTime.getSeconds(),
          endTime.getMilliseconds(),
          {
            latitude: this._latitude,
            longitude: this._longitude,
            offset: this._offset,
          },
        );
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in endOfDay:", error);
    }
    return this;
  }
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
