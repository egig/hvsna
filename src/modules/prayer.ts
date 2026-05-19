import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import dayjs from "dayjs";
import { useSettings } from "./settings";
import { useCallback } from "react";
import { getSunsetTime, isTimeAfter } from "./calendar/hijri/core";

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

export function usePrayerTimes() {
  let now = new Date();
  let prayerDate = now;
  const { settings } = useSettings();
  const getTodayPrayerTimes = useCallback(() => {
    const sunset = getSunsetTime(
      now,
      settings.location?.lat as number,
      settings.location?.lng as number
    );
    if (
      isTimeAfter(
        {
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds(),
          millisecond: now.getMilliseconds(),
        },
        sunset
      )
    ) {
      prayerDate = dayjs().add(1, "day").toDate();
    }
    return getPrayerTimeForDate(
      settings.location?.lat as number,
      settings.location?.lng as number,
      prayerDate
    );
  }, [settings]);

  return {
    getTodayPrayerTimes,
  };
}
