import { Coordinates, PrayerTimes } from "adhan";
import dayjs from "dayjs";
import { useSettings } from "./settings";
import { buildCalculationParameters } from "./prayer-calculation";
import { useCallback } from "react";
import { useHijriDate } from "./calendar/hijri";

export function usePrayerTimes() {
  const { currentHijriDate } = useHijriDate();
  const { settings } = useSettings();

  const getPrayerTimesForDate = useCallback(
    (da: Date) => {
      const coordinates = new Coordinates(
        settings.location?.lat as number,
        settings.location?.lng as number
      );
      const params = buildCalculationParameters(
        settings.calculationMethod,
        settings.madhab
      );
      const prayerTimes = new PrayerTimes(coordinates, da, params);
      return prayerTimes;
    },
    [settings]
  );

  const getTodayPrayerTimes = useCallback(() => {
    return getPrayerTimesForDate(new Date());
  }, [getPrayerTimesForDate, currentHijriDate]);

  const getPrayerEndTime = useCallback(
    (prayerName: string, d: Date): Date => {
      let prayerTimes = getPrayerTimesForDate(d);
      switch (prayerName.toLowerCase()) {
        case "fajr":
        case "sunrise":
          return new Date(prayerTimes.dhuhr.valueOf() - 1000);
        case "dhuhr":
          return new Date(prayerTimes.asr.valueOf() - 1000);
        case "asr":
          return new Date(prayerTimes.maghrib.valueOf() - 1000);
        case "maghrib":
          return new Date(prayerTimes.isha.valueOf() - 1000);
        case "isha":
          return dayjs(d).endOf("day").toDate();
      }

      throw new Error(`unknown prayer ${prayerName}`);
    },
    [getPrayerTimesForDate]
  );

  return {
    getTodayPrayerTimes,
    getPrayerTimesForDate,
    getPrayerEndTime,
  };
}
