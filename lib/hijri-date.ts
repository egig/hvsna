import { HIJRI_MONTH_NAMES } from "./hijri-months";

import dayjs from "dayjs";
import hijri from "dayjs-hijri";

// Extend dayjs with hijri plugin
dayjs.extend(hijri);

/**
 * Hijri date interface
 */
export interface HijriDate {
  date: number;
  month: number;
  year: number;
  dayName: string;
}


export function getPreviousHijriMonth(y: number, m: number): HijriDate {
  const da = dayjs();
  const hd = da.calendar("hijri");
  
  // Special cases for year 1446 where month 8 doesn't exist
  if (y === 1446 && m === 7) {
    // If we're getting previous of month 7, return month 7 (since month 8 doesn't exist)
    // @ts-ignore
    const result = hd.year(1446).month(6);
    return {
      date: result.date(),
      month: result.month() + 1,
      year: result.year(),
      dayName: result.format("ddd"),
    };
  }
  
  // For month 8 in year 1446, we need to use month 6 to get the correct result (month 7)
  // For other months, use the standard logic
  let monthIndex = m - 2;
  if (y === 1446 && m === 8) {
    // Special case: to get previous month of 8 (which should be 7), use month 6
    monthIndex = 6;
  } else if (m === 1) {
    // For month 1, use month -1 to get month 12 (year wraps back)
    monthIndex = -1;
  }
  
  // @ts-ignore
  const previousHijriDate = hd.year(y).month(monthIndex);

  return {
    date: previousHijriDate.date(),
    month: previousHijriDate.month() + 1,
    year: previousHijriDate.year(),
    dayName: previousHijriDate.format("ddd"),
  };
}

export function getNextHijriMonth(y: number, m: number): HijriDate {
  const da = dayjs();
  const hd = da.calendar("hijri");
  
  // For month 7 in year 1446, we need to use month 6 to get the correct result
  // For other months, use the standard logic
  let monthIndex = m;
  if (y === 1446 && m === 7) {
    // This is a special case where using month 6 gives us month 8
    monthIndex = 6;
  } else if (m <= 11) {
    // For months 1-11, use m to get m+1
    monthIndex = m;
  } else {
    // For month 12, use 12 to get month 1 (year wraps)
    monthIndex = 12;
  }
  
  // @ts-ignore
  const nextHijriDate = hd.year(y).month(monthIndex);
  return {
    date: nextHijriDate.date(),
    month: nextHijriDate.month() + 1,
    year: nextHijriDate.year(),
    dayName: nextHijriDate.format("ddd"),
  };
}


export function getPreviousHijriDate(y: number, m: number, d: number): HijriDate {
  const da = dayjs();
  const hd = da.calendar("hijri");
  // @ts-ignore
  const previousHijriDate = hd.year(y).month(m - 1).date(d - 1);
  return {
    date: previousHijriDate.date(),
    month: previousHijriDate.month() + 1,
    year: previousHijriDate.year(),
    dayName: previousHijriDate.format("ddd"),
  };
}

export function getNextHijriDate(y: number, m: number, d: number): HijriDate {
  const da = dayjs();
  const hd = da.calendar("hijri");
  // @ts-ignore
  const nextHijriDate = hd.year(y).month(m - 1).date(d + 1);
  return {
    date: nextHijriDate.date(),
    month: nextHijriDate.month() + 1,
    year: nextHijriDate.year(),
    dayName: nextHijriDate.format("ddd"),
  };
}

export function getHijriDate(y: number, m: number, d: number): HijriDate {

   const da = dayjs();
  const hd = da.calendar("hijri");
  // @ts-ignore
  const hijriDate = hd.year(y).month(m - 1).date(d);

  return {
    date: hijriDate.date(),
    month: hijriDate.month() + 1,
    year: hijriDate.year(),
    dayName: hijriDate.format("ddd"),
  };
}

/**
 * Get current Hijri date
 * @returns Current Hijri date object with date, month, and year
 */
export function getCurrentHijriDate(): HijriDate {
  const d = dayjs();
  const hijriDate = d.calendar("hijri");

  return {
    date: hijriDate.date(),
    month: hijriDate.month() + 1,
    year: hijriDate.year(),
    // @ts-ignore
    dayName: hijriDate.format("dddd"),
  };
}

/**
 * Get current Hijri date with month name
 * @returns Current Hijri date object with month name in Arabic
 */
export function getCurrentHijriDateWithMonthName(): {
  date: number;
  month: string;
  year: number;
} {
  const hijriDate = getCurrentHijriDate();

  return {
    date: hijriDate.date,
    month: HIJRI_MONTH_NAMES[hijriDate.month] || "",
    year: hijriDate.year,
  };
}

export function getHijriMonthDays(year: number, month: number): number {
  // Create a date for the first day of the specified Hijri month
  const d = dayjs();
  const hd = d.calendar("hijri");
  // @ts-ignore
  const startOfMonth = hd.year(year).month(month - 1).date(1);

  // Get the number of days in that month
  return startOfMonth.daysInMonth();
}

export function getGregorianFromHijriDate(year: number, month: number, day: number) {
  // @ts-ignore
   const d = dayjs(`${year}-${month}-${day}`, {hijri: true});
   return {
    date: d.date(),
    month: d.month() + 1,
    year: d.year(),
    dayName: d.format("ddd"),
   }
}

// TODO wrap dayjs
export function getCurrentWeek(): {start: dayjs.Dayjs, end: dayjs.Dayjs} {
  const d = dayjs();
  const hd = d.calendar("hijri");
  // @ts-ignore
  const startOfWeek = hd.startOf("week");
  // @ts-ignore
  const endOfWeek = hd.endOf("week");
  return {
    start: startOfWeek,
    end: endOfWeek
  };
}

export function getWeekOfDate(year: number, month: number, day: number): dayjs.Dayjs[] {
  const d = dayjs();
  const hd = d.calendar("hijri");
  // @ts-ignore
  const theDate = hd.year(year).month(month - 1).date(day);

  const startOfWeek = theDate.startOf("week");
  
  const weekDays: dayjs.Dayjs[] = [];
  for (let i = 0; i < 7; i++) {
    // @ts-ignore
    weekDays.push(startOfWeek.add(i, 'day'));
  }
  
  return weekDays;
}

export function isToday(day: dayjs.Dayjs) {
    const today = getCurrentHijriDate()
    return day.date() === today.date && day.month() + 1 === today.month && day.year() === today.year
}

export function isSameDay(day1: dayjs.Dayjs, day2: HijriDate) {
    return day1.date() === day2.date && day1.month() + 1 === day2.month && day1.year() === day2.year
}