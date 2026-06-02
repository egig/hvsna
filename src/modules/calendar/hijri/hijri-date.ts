import { hijriToGregorian } from "@tabby_ai/hijri-converter";
import { _applyOffset, fromDate, getSunset, toDate } from "./core";

/**
 * Options for HijriDate calculations
 */
export interface HijriDateOptions {
  offset?: number;
  monthOffsets?: Partial<Record<number, number>>;
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
  _jsDate!: Date;
  _latitude: number;
  _longitude: number;
  _offset?: number;
  _monthOffsets?: Partial<Record<number, number>>;
  _startOfWeek: number;
  _sunsetShift: number;
  _startOfDayEpoch: number;
  // _endOfDayEpoch: number;

  constructor(
    lat: number,
    lng: number,
    year: number,
    month: number,
    day: number,
    hour?: number,
    minute?: number,
    second?: number,
    millisecond?: number,
    options?: HijriDateOptions
  ) {
    this._latitude = lat;
    this._longitude = lng;
    this._offset = options?.offset || 0;
    this._monthOffsets = options?.monthOffsets;
    this._startOfWeek = options?.startOfWeek ?? 5; // Default to Friday (5) for Islamic calendar
    this._sunsetShift = options?.sunsetShift || 0;

    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour as number;
    this.minute = minute as number;
    this.second = second as number;
    this.millisecond = millisecond as number;
    const { epoch, startOfDay } = toDate(
      this._latitude,
      this._longitude,
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
      }
    );

    this._jsDate = new Date(epoch);
    this._startOfDayEpoch = startOfDay;

    // When no time is given, epoch === startOfDay (the preceding sunset — a Monday evening).
    // The Hijri day's display Gregorian day is the day after that sunset (Tuesday).
    // Applying a +1 shift here corrects the weekday column without changing core.ts.
    const isAtStartOfDay = epoch === startOfDay;
    const startOfWeekDay = this._startOfWeek ?? 5;
    const effectiveSunsetShift =
      options?.sunsetShift ?? (isAtStartOfDay ? 1 : 0);
    this.dayOfWeek =
      (this._jsDate.getDay() - startOfWeekDay + 7 + effectiveSunsetShift) % 7;
  }

  static fromDate(
    lat: number,
    long: number,
    date: Date,
    options?: HijriDateOptions
  ): HijriDate {
    let h = fromDate(lat, long, date, {
      offset: options?.offset || 0,
      monthOffsets: options?.monthOffsets,
    });

    const hijriDateObj = new HijriDate(
      lat,
      long,
      h.year,
      h.month,
      h.day,
      h.hour,
      h.minute,
      h.second,
      h.millisecond,
      {
        offset: options?.offset,
        monthOffsets: options?.monthOffsets,
        startOfWeek: options?.startOfWeek,
        sunsetShift: h.sunsetShift,
      }
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
    const prev = _applyOffset(
      { year: this.year, month: this.month, day: this.day },
      -1
    );
    return new HijriDate(
      this._latitude,
      this._longitude,
      prev.year,
      prev.month,
      prev.day,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        offset: this._offset ?? 0,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
      }
    );
  }

  next(): HijriDate {
    const next = _applyOffset(
      { year: this.year, month: this.month, day: this.day },
      1
    );
    return new HijriDate(
      this._latitude,
      this._longitude,
      next.year,
      next.month,
      next.day,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
      }
    );
  }

  startOfWeek(): HijriDate {
    // Use noon of the display day (startOfDayEpoch + 18h) as anchor to avoid
    // _jsDate landing on the sunset boundary and computing the wrong weekday.
    const displayDayNoon = new Date(this._startOfDayEpoch + 18 * 3600 * 1000);
    const rawDayOfWeek = displayDayNoon.getDay();
    const startOfWeekDay = this._startOfWeek ?? 5;

    const daysToSubtract =
      rawDayOfWeek >= startOfWeekDay
        ? rawDayOfWeek - startOfWeekDay
        : rawDayOfWeek + (7 - startOfWeekDay);

    const ref = new Date(displayDayNoon);
    ref.setDate(ref.getDate() - daysToSubtract);
    ref.setHours(12, 0, 0, 0);

    return HijriDate.fromDate(this._latitude, this._longitude, ref, {
      offset: this._offset,
      monthOffsets: this._monthOffsets,
      startOfWeek: this._startOfWeek,
    });
  }

  endOfWeek(): HijriDate {
    // Get the start of the week first
    const startOfWeek = this.startOfWeek();

    // Add 6 days to get to the end of the week (Friday + 6 = Thursday)
    const endOfWeekGregorian = new Date(startOfWeek._jsDate);
    endOfWeekGregorian.setDate(endOfWeekGregorian.getDate() + 6);

    return HijriDate.fromDate(
      this._latitude,
      this._longitude,
      endOfWeekGregorian,
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
      }
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
    const today = HijriDate.fromDate(
      this._latitude,
      this._longitude,
      new Date(),
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
      }
    );
    return (
      this.year === today.year &&
      this.month === today.month &&
      this.day === today.day
    );
  }

  isTomorrow(): boolean {
    const today = HijriDate.fromDate(
      this._latitude,
      this._longitude,
      new Date(),
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
      }
    );
    const tomorrow = today.next();
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
    return HijriDate.fromDate(
      this._latitude,
      this._longitude,
      new Date(this._startOfDayEpoch),
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
        sunsetShift: this._sunsetShift,
      }
    );
  }

  endOfDay(): HijriDate {
    let nextStartEpoch = this.next().startOfDay().toDate().valueOf();
    return HijriDate.fromDate(
      this._latitude,
      this._longitude,
      new Date(nextStartEpoch - 1000),
      {
        offset: this._offset,
        monthOffsets: this._monthOffsets,
        startOfWeek: this._startOfWeek,
        sunsetShift: this._sunsetShift,
      }
    );
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
 * Check if current time is after sunset for given location
 */
export function isAfterSunset(
  date: Date,
  latitude: number,
  longitude: number
): boolean {
  const sunset = getSunset(latitude, longitude, date);
  return sunset ? date >= sunset : false;
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
