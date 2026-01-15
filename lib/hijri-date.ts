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
  // m is 1 based
  let currentM = m-1;

  // @ts-ignore
  const previousHijriDate = hd.year(y).month(currentM-1);

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
  // m is 1 based
  let currentM = m-1;
  
  // @ts-ignore
  // m is 1 based
  const nextHijriDate = hd.year(y).month(currentM + 1);
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