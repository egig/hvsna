import type { PrayerTimesResponse } from "./prayer-times";
import type { PrayerTimesFallback, GeneralSettings } from "./settings/settings";
import type { PrayerTime, Task } from "@/domain/task";
import { getPrayerTimes } from "./prayer-times";

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

export function groupTasksByPrayerTimes(
  tasks: Task[],
  prayerTimings: PrayerTimesResponse["data"]["timings"]
): {
  prayer: PrayerTime | null;
  tasks: Task[];
  isOverdue?: boolean;
  isCompleted?: boolean;
  isTimeBased?: boolean;
  atTime?: string;
}[] {
  const groups: {
    prayer: PrayerTime | null;
    tasks: Task[];
    isOverdue?: boolean;
    isCompleted?: boolean;
    isTimeBased?: boolean;
    atTime?: string;
  }[] = [];

  tasks = tasks.map((t) => {
    if (!!t.prayerTime) {
      t.atEpochMillis = prayerTimeToEpochToday(
        prayerTimings[t.prayerTime],
        prayerTimings.Maghrib
      );
    }
    return t;
  });

  // Separate tasks by type and status
  const overdueTasks = tasks.filter(
    (task) => task.isOverdue() && !task.completedAt
  );

  const prayerBasedTasks = tasks.filter(
    (task) => task.prayerTime && !task.isOverdue() && !task.completedAt
  );
  const timeBasedTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      task.atTime &&
      !task.isOverdue() &&
      !task.completedAt
  );
  const regularTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      !task.atTime &&
      !task.isOverdue() &&
      !task.completedAt
  );
  const completedTasks = tasks.filter((task) => task.completedAt);

  // Add overdue tasks first
  if (overdueTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: overdueTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
      isOverdue: true,
    });
  }

  // Build prayer groups (only prayer-assigned tasks)
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

  // Islamic day starts at Maghrib — shift all times relative to it for correct ordering
  const maghribMinutes = timeToMinutes(prayerTimings.Maghrib);
  const toIslamicDay = (minutes: number) =>
    minutes >= maghribMinutes
      ? minutes - maghribMinutes
      : minutes + (24 * 60 - maghribMinutes);

  // Create a sorted list of all timed slots (prayer + individual time-based tasks)
  type Slot =
    | { type: "prayer"; prayer: PrayerTime; minutes: number }
    | { type: "time"; task: Task; minutes: number };

  const slots: Slot[] = [];

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
      slots.push({
        type: "prayer",
        prayer,
        minutes: timeToMinutes(prayerTimings[prayer]),
      });
    }
  });

  timeBasedTasks.forEach((task) => {
    if (task.atTime) {
      slots.push({ type: "time", task, minutes: timeToMinutes(task.atTime) });
    }
  });

  slots.sort((a, b) => toIslamicDay(a.minutes) - toIslamicDay(b.minutes));

  // Build groups from sorted slots
  slots.forEach((slot) => {
    if (slot.type === "prayer") {
      groups.push({
        prayer: slot.prayer,
        tasks: prayerGroups[slot.prayer].sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
        ),
      });
    } else {
      groups.push({
        prayer: null,
        tasks: [slot.task],
        isTimeBased: true,
        atTime: slot.task.atTime,
      });
    }
  });

  // Add regular tasks (no specific time) after all timed groups
  if (regularTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: regularTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
    });
  }

  // Add all completed tasks in a single group at the bottom
  if (completedTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: completedTasks.sort(
        (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
      ),
      isCompleted: true,
    });
  }

  return groups;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function prayerTimeToEpochToday(time: string, maghrib: string): number {
  let now = new Date();
  const maghribMinutes = timeToMinutes(maghrib);
  const m = timeToMinutes(time);
  let d = now.getDate();
  if (m >= maghribMinutes) {
    d = d - 1;
  }

  let t = new Date(
    now.getFullYear(),
    now.getMonth(),
    d,
    0,
    timeToMinutes(time),
    0,
    0
  );
  return t.valueOf();
}
