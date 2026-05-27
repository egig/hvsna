import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import dayjs from "dayjs";

/**
 * Interface for Hijri date components
 */
export interface HijriDateComponents {
  year: number;
  month: number;
  day: number;
  sunsetShift?: number;
}

/**
 * Interface for time components
 */
export interface TimeComponents {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

/**
 * Options for date conversion
 */
export interface ConversionOptions {
  offset: number;
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
  latitude: number,
  longitude: number,
  year: number,
  month: number,
  day: number,
  hour: number | undefined,
  minutes: number = 0,
  seconds: number = 0,
  milliseconds: number = 0,
  options: ConversionOptions
): { epoch: number; startOfDay: number } {
  const offset = options?.offset ?? 0;

  const adjustedHijri = _applyOffset(
    {
      year,
      month,
      day,
    },
    -1 * offset
  );

  const gregorian = hijriToGregorian(adjustedHijri);
  let gregorianDate = new Date(
    gregorian.year,
    gregorian.month - 1,
    gregorian.day
  );

  let result = { epoch: -1, startOfDay: -1 };
  let yesterdayGreg = dayjs(new Date(gregorianDate))
    .subtract(1, "day")
    .toDate();
  const y = getSunset(latitude, longitude, yesterdayGreg);
  let startOfDayDate = new Date(yesterdayGreg);
  startOfDayDate.setHours(
    y.getHours(),
    y.getMinutes(),
    y.getSeconds(),
    y.getMilliseconds()
  );
  result.startOfDay = startOfDayDate.valueOf();

  // use start of day if no hijri time supplied
  // start of day = yesterday sunset time
  if (!hour) {
    result.epoch = result.startOfDay;
    return result;
  }

  const s = getSunset(latitude, longitude, yesterdayGreg);
  let useStartOfDay = isTimeSameOrAfter(
    { hour, minutes, seconds, milliseconds },
    {
      hour: s.getHours(),
      minute: s.getMinutes(),
      second: s.getSeconds(),
      millisecond: s.getMilliseconds(),
    }
  );

  if (useStartOfDay) {
    yesterdayGreg.setHours(hour, minutes, seconds, milliseconds);
    result.epoch = yesterdayGreg.valueOf();
    return result;
  }

  gregorianDate.setHours(hour, minutes, seconds, milliseconds);
  result.epoch = gregorianDate.valueOf();
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
  latitude: number,
  longitude: number,
  gregorianDate: Date,
  options: ConversionOptions
): HijriDateComponents & TimeComponents {
  const offset = options?.offset ?? 0;

  let hijriDate = gregorianToHijri({
    year: gregorianDate.getFullYear(),
    month: gregorianDate.getMonth() + 1, // JavaScript months are 0-based
    day: gregorianDate.getDate(),
  });

  const sunset = getSunset(latitude, longitude, gregorianDate);

  // NOTE - the milliseconds of the sunset seems not stable
  // so we only check until the seconds level
  const isOrAfterSunset =
    Math.ceil(gregorianDate.valueOf() / 1000) >=
    Math.ceil(sunset.valueOf() / 1000);

  let sunsetShift = 0;
  if (isOrAfterSunset) {
    hijriDate = _applyOffset(hijriDate, 1);
    sunsetShift = 1;
  }

  const adjustedHijri = _applyOffset(hijriDate, offset);
  return Object.assign(adjustedHijri, {
    sunsetShift: sunsetShift,
    hour: gregorianDate.getHours(),
    minute: gregorianDate.getMinutes(),
    second: gregorianDate.getSeconds(),
    millisecond: gregorianDate.getMilliseconds(),
  });
}

/**
 * Checks if a given time is after sunset time
 */
export function isTimeSameOrAfter(
  time: {
    hour: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  },
  sunsetTime: TimeComponents
): boolean {
  if (!sunsetTime) {
    return false;
  }

  if (
    time.hour === undefined ||
    time.minutes === undefined ||
    time.seconds === undefined ||
    time.milliseconds === undefined
  ) {
    return false;
  }

  if (time.hour > sunsetTime.hour) {
    return true;
  }

  if (time.hour === sunsetTime.hour && time.minutes > sunsetTime.minute) {
    return true;
  }

  if (
    time.hour === sunsetTime.hour &&
    time.minutes === sunsetTime.minute &&
    time.seconds > sunsetTime.second
  ) {
    return true;
  }

  if (
    time.hour === sunsetTime.hour &&
    time.minutes === sunsetTime.minute &&
    time.seconds === sunsetTime.second &&
    time.milliseconds >= sunsetTime.millisecond
  ) {
    return true;
  }

  return false;
}

function _applyOffset(
  d: HijriDateComponents,
  offset: number
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

export function getSunset(lat: number, long: number, d: Date): Date {
  const coordinates = new Coordinates(lat, long);
  const params = CalculationMethod.UmmAlQura();
  const prayerTimes = new PrayerTimes(coordinates, d, params);
  return prayerTimes.maghrib;
}
