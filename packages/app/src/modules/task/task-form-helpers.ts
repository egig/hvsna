/**
 * Reusable helper functions for task form operations
 */
import { usePrayerTimes } from "../prayer";
import dayjs from "dayjs";

export function useTaskEpoch() {
  const { getPrayerEndTime } = usePrayerTimes();
  return function getTaskEpoch(date: Date, atTime: string): number | null {
    if (!!atTime && !atTime.includes(":")) {
      return getPrayerEndTime(atTime.toLowerCase(), date).valueOf();
    }

    if (!!atTime && atTime.includes(":")) {
      const [h, m] = atTime.split(":").map(Number);
      let da = new Date(date);
      da.setHours(h, m);
      return da.valueOf();
    }
    return dayjs(date).endOf("day").valueOf();
  };
}
