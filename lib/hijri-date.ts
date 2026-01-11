import { HIJRI_MONTH_NAMES } from "./hijri-months";

import dayjs from 'dayjs';
import hijri from 'dayjs-hijri';

// Extend dayjs with hijri plugin
dayjs.extend(hijri);

/**
 * Hijri date interface
 */
export interface HijriDate {
  date: number;
  month: number;
  year: number;
}

/**
 * Get current Hijri date
 * @returns Current Hijri date object with date, month, and year
 */
export function getCurrentHijriDate(): HijriDate {
  const d = dayjs()
  const hijriDate = d.calendar('hijri')
  
  return {
    date: hijriDate.date(),
    month: hijriDate.month(),
    year: hijriDate.year()
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
    month: HIJRI_MONTH_NAMES[hijriDate.month - 1] || '',
    year: hijriDate.year
  };
}



export function getHijriMonthDays(year: number, month: number): number {
  // Create a date for the first day of the specified Hijri month
  const d = dayjs();
  const hd = d.calendar('hijri');
  // @ts-ignore
  const startOfMonth = hd.year(year).month(month - 1).date(1);

  // Get the number of days in that month
  return startOfMonth.daysInMonth();
}