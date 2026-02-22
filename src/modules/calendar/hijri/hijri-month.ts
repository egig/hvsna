import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";

export class HijriMonth {
  year: number;
  month: number;
  _rawGregorianDate: Date;

  constructor(year: number, month: number) {
    this.year = year;
    this.month = month;
    // Use the first day of the month for conversion
    let d = hijriToGregorian({ year, month, day: 1 });
    this._rawGregorianDate = new Date(d.year, d.month - 1, d.day);
  }

  previous(): HijriMonth {
    // Use the raw Gregorian date to calculate previous month
    // Subtract approximately 29 days to get to previous Hijri month
    const prevGregorianDate = new Date(this._rawGregorianDate);
    prevGregorianDate.setDate(prevGregorianDate.getDate() - 29);

    const hijriDate = gregorianToHijri({
      year: prevGregorianDate.getFullYear(),
      month: prevGregorianDate.getMonth() + 1,
      day: prevGregorianDate.getDate(),
    });

    return new HijriMonth(hijriDate.year, hijriDate.month);
  }

  next(): HijriMonth {
    // Use the raw Gregorian date to calculate next month
    // Add approximately 30 days to get to next Hijri month
    const nextGregorianDate = new Date(this._rawGregorianDate);
    nextGregorianDate.setDate(nextGregorianDate.getDate() + 30);

    const hijriDate = gregorianToHijri({
      year: nextGregorianDate.getFullYear(),
      month: nextGregorianDate.getMonth() + 1,
      day: nextGregorianDate.getDate(),
    });

    return new HijriMonth(hijriDate.year, hijriDate.month);
  }

  getDaysInMonth(): number {
    // Check different days to find the maximum valid day in this month
    let maxDay = 30;
    for (let day = 30; day >= 1; day--) {
      try {
        hijriToGregorian({ year: this.year, month: this.month, day });
        maxDay = day;
        break;
      } catch (error) {
        // Day is invalid, continue checking
      }
    }
    return maxDay;
  }

  getFirstDay(): HijriDate {
    // Create a Gregorian date for the first day of this Hijri month
    const gregorianDate = hijriToGregorian({
      year: this.year,
      month: this.month,
      day: 1,
    });
    const date = new Date(
      gregorianDate.year,
      gregorianDate.month - 1,
      gregorianDate.day,
    );
    return HijriDate.fromDate(date);
  }

  getLastDay(): HijriDate {
    const daysInMonth = this.getDaysInMonth();
    // Create a Gregorian date for the last day of this Hijri month
    const gregorianDate = hijriToGregorian({
      year: this.year,
      month: this.month,
      day: daysInMonth,
    });
    const date = new Date(
      gregorianDate.year,
      gregorianDate.month - 1,
      gregorianDate.day,
    );
    return HijriDate.fromDate(date);
  }

  toString(): string {
    return `${this.year}-${this.month.toString().padStart(2, "0")}`;
  }

  equals(other: HijriMonth): boolean {
    return this.year === other.year && this.month === other.month;
  }
}

// Import HijriDate for the getFirstDay and getLastDay methods
import { HijriDate } from "./hijri-date";
