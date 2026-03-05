import type { PrayerTimesResponse } from "./prayer-times";
import type {
  PrayerTimesFallback,
  GeneralSettings,
} from "../modules/settings/settings";
import type { PrayerTime, Task } from "../modules/task/types";
import { getPrayerTimes } from "./prayer-times";

export async function getPrayerTimesWithFallback(
  settings: GeneralSettings,
  date: string,
): Promise<PrayerTimesResponse["data"]["timings"]> {
  // If no location coordinates, use fallback immediately
  if (!settings.coordinate) {
    return convertFallbackToTimings(settings.prayerTimesFallback);
  }

  try {
    const response = await getPrayerTimes({
      date,
      latitude: settings.coordinate.latitude,
      longitude: settings.coordinate.longitude,
      timezonestring: settings.timezone,
    });
    return response.data.timings;
  } catch (error) {
    console.warn("Failed to fetch prayer times, using fallback:", error);
    return convertFallbackToTimings(settings.prayerTimesFallback);
  }
}

function convertFallbackToTimings(
  fallback: PrayerTimesFallback | undefined,
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

export function groupTasksByPrayerTimes(
  tasks: Task[],
  prayerTimings: PrayerTimesResponse["data"]["timings"],
): {
  prayer: PrayerTime | null;
  tasks: Task[];
  isOverdue?: boolean;
  isCompleted?: boolean;
}[] {
  const groups: {
    prayer: PrayerTime | null;
    tasks: Task[];
    isOverdue?: boolean;
    isCompleted?: boolean;
  }[] = [];

  // Separate tasks by type and status
  const overdueTasks = tasks.filter(
    (task) => task.isOverdue() && !task.completedAt,
  );
  const prayerBasedTasks = tasks.filter(
    (task) => task.usePrayerTime && task.prayerTime && !task.completedAt,
  );
  const timeBasedTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      task.atTime &&
      !task.isOverdue() &&
      !task.completedAt,
  );
  const regularTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      !task.atTime &&
      !task.isOverdue() &&
      !task.completedAt,
  );
  const completedTasks = tasks.filter((task) => task.completedAt);

  // Add overdue tasks first
  if (overdueTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: overdueTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
      ),
      isOverdue: true,
    });
  }

  // Add prayer-based tasks in their original groups
  const prayerGroups: Record<PrayerTime, Task[]> = {
    Fajr: [],
    Sunrise: [],
    Dhuhr: [],
    Asr: [],
    Maghrib: [],
    Isha: [],
  };

  prayerBasedTasks.forEach((task) => {
    if (task.prayerTime && prayerGroups[task.prayerTime]) {
      prayerGroups[task.prayerTime].push(task);
    }
  });

  // Add time-based tasks to appropriate prayer groups
  timeBasedTasks.forEach((task) => {
    if (task.atTime) {
      const prayerTime = findPrayerTimeForTaskTime(task.atTime, prayerTimings);
      if (prayerTime) {
        prayerGroups[prayerTime].push(task);
      }
    }
  });

  // Add prayer groups in chronological order starting from Maghrib
  const prayerOrder: PrayerTime[] = [
    "Maghrib",
    "Isha",
    "Fajr",
    "Sunrise",
    "Dhuhr",
    "Asr",
  ];

  prayerOrder.forEach((prayer) => {
    if (prayerGroups[prayer].length > 0) {
      groups.push({
        prayer,
        tasks: prayerGroups[prayer].sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
        ),
      });
    }
  });

  // Add regular tasks (no specific time)
  if (regularTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: regularTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
      ),
    });
  }

  // Add all completed tasks in a single group at the bottom
  if (completedTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: completedTasks.sort(
        (a, b) => (b.completedAt || 0) - (a.completedAt || 0),
      ),
      isCompleted: true,
    });
  }

  return groups;
}

function findPrayerTimeForTaskTime(
  taskTime: string,
  prayerTimings: PrayerTimesResponse["data"]["timings"],
): PrayerTime | null {
  // Convert task time to minutes for comparison
  const [taskHours, taskMinutes] = taskTime.split(":").map(Number);
  const taskTotalMinutes = taskHours * 60 + taskMinutes;

  // Convert prayer times to minutes and find the closest one
  const prayerTimes: { prayer: PrayerTime; minutes: number }[] = [
    { prayer: "Fajr", minutes: timeToMinutes(prayerTimings.Fajr) },
    { prayer: "Sunrise", minutes: timeToMinutes(prayerTimings.Sunrise) },
    { prayer: "Dhuhr", minutes: timeToMinutes(prayerTimings.Dhuhr) },
    { prayer: "Asr", minutes: timeToMinutes(prayerTimings.Asr) },
    { prayer: "Maghrib", minutes: timeToMinutes(prayerTimings.Maghrib) },
    { prayer: "Isha", minutes: timeToMinutes(prayerTimings.Isha) },
  ];

  // Find the prayer time that the task time is closest to
  let closestPrayer: PrayerTime | null = null;
  let minDifference = Infinity;

  prayerTimes.forEach(({ prayer, minutes }) => {
    const difference = Math.abs(taskTotalMinutes - minutes);
    if (difference < minDifference) {
      minDifference = difference;
      closestPrayer = prayer;
    }
  });

  // Only assign to prayer time if within 30 minutes
  return minDifference <= 30 ? closestPrayer : null;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
