import dayjs from 'dayjs';

/**
 * Gregorian date interface
 */
export interface GregorianDate {
  date: number;
  month: number;
  year: number;
  dayName: string;
  monthName: string;
  formatted: string;
}

/**
 * Get current Gregorian date
 * @returns Current Gregorian date object with date, month, and year
 */
export function getCurrentGregorianDate(): GregorianDate {
  const now = dayjs();
  
  return {
    date: now.date(),
    month: now.month() + 1, // dayjs months are 0-indexed
    year: now.year(),
    dayName: now.format('dddd'),
    monthName: now.format('MMMM'),
    formatted: now.format('YYYY-MM-DD')
  };
}

/**
 * Get current Gregorian date with custom format
 * @param format - dayjs format string (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export function getCurrentGregorianDateFormatted(format: string = 'YYYY-MM-DD'): string {
  return dayjs().format(format);
}

/**
 * Get current Gregorian date components
 * @returns Object with individual date components
 */
export function getCurrentGregorianDateComponents(): {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  second: number;
} {
  const now = dayjs();
  
  return {
    day: now.date(),
    month: now.month() + 1,
    year: now.year(),
    hour: now.hour(),
    minute: now.minute(),
    second: now.second()
  };
}
