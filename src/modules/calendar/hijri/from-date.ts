import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { HijriDate, type HijriDateOptions } from "./hijri-date";

// Jakarta coordinates (default location)
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;

/**
 * Convert JavaScript Date to HijriDate with sunset calculation and offset support
 * @param date JavaScript Date object to convert
 * @param options Optional configuration including latitude, longitude, and offset
 * @returns HijriDate object
 */
export function fromDate(date: Date, options?: HijriDateOptions): HijriDate {
  // Use Jakarta coordinates as default if not provided
  const lat = options?.latitude ?? DEFAULT_LATITUDE;
  const lng = options?.longitude ?? DEFAULT_LONGITUDE;
  const offset = options?.offset ?? 0;

  const baseHijriDate = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1, // Month number in Javascript Date API is zero-based.
    day: date.getDate(),
  });

  const hijriDateObj = new HijriDate(
    baseHijriDate.year,
    baseHijriDate.month,
    baseHijriDate.day,
    date.getHours(),
    date.getMinutes(),
    {
      jsDate: date,
      latitude: lat,
      longitude: lng,
      offset: offset,
      startOfWeek: options?.startOfWeek,
    },
  );

  if (offset !== 0) {
    hijriDateObj.advanceDays(offset);
  }

  hijriDateObj.advanceDayIfAfterSunset(date, lat, lng);
  return hijriDateObj;
}
