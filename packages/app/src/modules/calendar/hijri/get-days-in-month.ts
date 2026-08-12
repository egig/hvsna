import { hijriToGregorian } from "@tabby_ai/hijri-converter";

/**
 * Get the actual number of days in a Hijri month
 * @param year Hijri year
 * @param month Hijri month (1-12)
 * @returns Number of days in the month (29 or 30)
 */
export function getDaysInMonth(year: number, month: number): number {
  try {
    hijriToGregorian({ year, month, day: 30 });
    return 30;
  } catch (error) {
    // Day is invalid, continue checking
  }

  return 29;
}
