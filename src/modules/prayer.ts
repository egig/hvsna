import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import dayjs from "dayjs";

export default function getTodayPrayerTimes(lat: number, lng: number) {
  return getPrayerTimeForDate(lat, lng, new Date())
}

export function getPrayerTimeForDate(lat: number, lng: number, date: Date) {
  const coordinates = new Coordinates(lat, lng);
  const params = CalculationMethod.UmmAlQura();
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  const yesterday = dayjs(date).subtract(1, "day").toDate();
  const ptYesterday = new PrayerTimes(coordinates, yesterday, params);

  prayerTimes.maghrib = ptYesterday.maghrib;
  prayerTimes.isha = ptYesterday.isha;
  return prayerTimes;
}