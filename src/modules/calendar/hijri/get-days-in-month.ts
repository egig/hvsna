import { hijriToGregorian } from "@tabby_ai/hijri-converter";

/**
 * Get the actual number of days in a Hijri month
 * @param year Hijri year
 * @param month Hijri month (1-12)
 * @returns Number of days in the month (29 or 30)
 */
export function getDaysInMonth(year: number, month: number): number {
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
