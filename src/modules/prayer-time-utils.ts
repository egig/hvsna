import type { PrayerTimesResponse } from "./prayer-times";
import type { PrayerTimesFallback, GeneralSettings } from "./settings/settings";
import type { Task } from "@/domain/task";
import { getPrayerTimes } from "./prayer-times";
import type { PrayerTimes } from "adhan";

export async function getPrayerTimesWithFallback(
  settings: GeneralSettings,
  date: string
): Promise<PrayerTimesResponse["data"]["timings"]> {
  // If no location coordinates, use fallback immediately
  if (!settings.location) {
    return convertFallbackToTimings(settings.prayerTimesFallback);
  }

  try {
    const response = await getPrayerTimes({
      date,
      latitude: settings.location?.lat as number,
      longitude: settings.location?.lng as number,
      timezonestring: settings.timezone,
    });
    return response.data.timings;
  } catch (error) {
    console.warn("Failed to fetch prayer times, using fallback:", error);
    return convertFallbackToTimings(settings.prayerTimesFallback);
  }
}

function convertFallbackToTimings(
  fallback: PrayerTimesFallback | undefined
): PrayerTimesResponse["data"]["timings"] {
  const defaultTimings = {
    Fajr: "05:00",
    Sunrise: "06:00",
    Dhuhr: "12:00",
    Asr: "15:00",
    Sunset: "18:00",
    Maghrib: "18:00",
    Isha: "19:00",
    Imsak: "04:45",
    Midnight: "00:00",
    Firstthird: "22:00",
    Lastthird: "01:00",
  };

  if (!fallback) {
    return defaultTimings;
  }

  return {
    Fajr: fallback.fajr,
    Sunrise: fallback.sunrise,
    Dhuhr: fallback.dzuhr, // Note: dzuhr vs Dhuhr spelling difference
    Asr: fallback.asr,
    Sunset: fallback.maghrib, // Use Maghrib time for Sunset
    Maghrib: fallback.maghrib,
    Isha: fallback.isha,
    Imsak: "04:45",
    Midnight: "00:00",
    Firstthird: "22:00",
    Lastthird: "01:00",
  };
}

export function isPrayerBased(t: Task) {
  return !!t.atTime && !t.atTime.includes(":");
}

function isInSamePrayerGroup(current: Task, prev: Task) {
  if (isPrayerBased(current) && isPrayerBased(prev)) {
    return current.atTime === prev.atTime;
  }

  if (isPrayerBased(current) && !isPrayerBased(prev)) {
    return false;
  }

  if (!isPrayerBased(current) && isPrayerBased(prev)) {
    return false;
  }

  return true;
}

export function groupTasksByPrayerTimes(
  tasks: Task[],
  prayerTimings: PrayerTimes
) {
  let tmpTasks = tasks
    .map((t) => {
      if (isPrayerBased(t)) {
        let tpTime =
          prayerTimings[t.atTime?.toLowerCase() as keyof PrayerTimes];
        return {
          n: (tpTime as Date).valueOf(),
          item: t,
        };
      }

      return {
        n: t.atEpochMillis || 0,
        item: t,
      };
    })
    .sort((a, b) => a.n - b.n);

  const overdueTasks: Task[] = [];
  let groups = [];
  let currentGroup: Task[] = [];
  for (let i = 0; i < tmpTasks.length; i++) {
    let current = tmpTasks[i];
    if (current.n < new Date().valueOf()) {
      overdueTasks.push(current.item);
      continue;
    }

    if (i > 0) {
      let prev = tmpTasks[i - 1];
      if (!isInSamePrayerGroup(current.item, prev.item)) {
        if (!!currentGroup.length) {
          let a = currentGroup[currentGroup.length - 1];
          groups.push({
            label: isPrayerBased(a) ? a.atTime : "",
            prayer: isPrayerBased(a) ? a.atTime : "",
            tasks: [...currentGroup],
          });
          currentGroup = [];
        }
      }
    }

    currentGroup.push(current.item);
  }
  if (!!currentGroup.length) {
    groups.push({
      label: isPrayerBased(currentGroup[currentGroup.length - 1])
        ? currentGroup[currentGroup.length - 1].atTime
        : "",
      prayer: isPrayerBased(currentGroup[currentGroup.length - 1])
        ? currentGroup[currentGroup.length - 1].atTime
        : "",
      tasks: [...currentGroup],
    });
  }

  if (overdueTasks.length) {
    groups.unshift({
      label: "overdue",
      isOverdue: true,
      tasks: overdueTasks,
    });
  }

  return groups;
}
