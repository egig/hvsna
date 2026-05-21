import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import dayjs from "dayjs";
import { useSettings } from "./settings";
import { useCallback } from "react";
import { HijriDate, useHijriDate } from "./calendar/hijri";

export function usePrayerTimes() {
  const { currentHijriDate } = useHijriDate();
  const { settings } = useSettings();

  const getPrayerTimesForHijriDate = useCallback(
    (d: HijriDate) => {
      const coordinates = new Coordinates(
        settings.location?.lat as number,
        settings.location?.lng as number
      );
      const params = CalculationMethod.UmmAlQura();
      // IMPORTANT ! we allways get the prayer times by the end of hijri date
      // so we can decide that the maghrib always at yesterday
      let da = d.endOfDay().toDate();
      const prayerTimes = new PrayerTimes(coordinates, da, params);
      const yesterday = dayjs(da).subtract(1, "day").toDate();
      const ptYesterday = new PrayerTimes(coordinates, yesterday, params);
      prayerTimes.maghrib = ptYesterday.maghrib;
      prayerTimes.isha = ptYesterday.isha;
      return prayerTimes;
    },
    [settings]
  );

  const getTodayPrayerTimes = useCallback(() => {
    return getPrayerTimesForHijriDate(currentHijriDate);
  }, [getPrayerTimesForHijriDate, currentHijriDate]);

  const getPrayerEndTime = useCallback(
    (prayerName: string, d: HijriDate): Date => {
      let prayerTimes = getPrayerTimesForHijriDate(d);
      switch (prayerName.toLowerCase()) {
        case "maghrib":
          return prayerTimes.isha;
        case "isha":
          return prayerTimes.fajr;
        // Sunrise / Dhuha is sunnah so we set fajr end time to dhuhr
        case "fajr":
        case "sunrise":
          return prayerTimes.dhuhr;
        case "dhuhr":
          return prayerTimes.asr;
        case "asr":
          let tom = getPrayerTimesForHijriDate(d.next());
          return tom.maghrib;
      }

      throw new Error(`unknown prayer ${prayerName}`);
    },
    [getPrayerTimesForHijriDate]
  );

  return {
    getTodayPrayerTimes,
    getPrayerTimesForHijriDate,
    getPrayerEndTime,
  };
}
