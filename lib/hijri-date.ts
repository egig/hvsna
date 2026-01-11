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
