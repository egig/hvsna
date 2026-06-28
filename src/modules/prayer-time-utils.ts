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
  return typeof t.atTime === "string" && !t.atTime.includes(":");
}

export function groupTasksByPrayerTimes(
  tasks: Task[],
  endOfTodayEpoch?: number,
  _prayerTimings?: PrayerTimes | null
) {
  const now = Date.now();

  const overdue: Task[] = [];
  const groupMap = new Map<string, Task[]>();
  const endOfDay: Task[] = [];
  const tomorrow: Task[] = [];

  for (const task of tasks) {
    if (!task.atEpochMillis) {
      continue;
    }

    if (task.atEpochMillis < now) {
      overdue.push(task);
      continue;
    }

    if (
      endOfTodayEpoch != null &&
      task.atEpochMillis != null &&
      task.atEpochMillis > endOfTodayEpoch
    ) {
      tomorrow.push(task);
      continue;
    }

    if (!task.atTime) {
      endOfDay.push(task);
      continue;
    }

    const key = task.atTime;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(task);
  }

  overdue.sort((a, b) => (a.atEpochMillis ?? 0) - (b.atEpochMillis ?? 0));
  tomorrow.sort((a, b) => (a.atEpochMillis ?? 0) - (b.atEpochMillis ?? 0));

  const scheduledGroups = Array.from(groupMap.values())
    .map((groupTasks) => {
      const sorted = [...groupTasks].sort(
        (a, b) => (a.atEpochMillis ?? 0) - (b.atEpochMillis ?? 0)
      );
      const prayer = isPrayerBased(sorted[0]) ? sorted[0].atTime! : undefined;
      return {
        label: prayer ?? "",
        prayer,
        tasks: sorted,
        _minEpoch: sorted[0].atEpochMillis!,
      };
    })
    .sort((a, b) => a._minEpoch - b._minEpoch);

  const groups: any[] = [];

  if (overdue.length) {
    groups.push({ label: "overdue", isOverdue: true, tasks: overdue });
  }

  for (const { _minEpoch: _ignored, ...g } of scheduledGroups) {
    groups.push(g);
  }

  if (endOfDay.length) {
    groups.push({ label: "", isEndOfDay: true, tasks: endOfDay });
  }

  if (tomorrow.length) {
    groups.push({ label: "", isTomorrow: true, tasks: tomorrow });
  }

  return groups;
}
