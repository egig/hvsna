import type { Task } from "@/domain/task";
import type { PrayerTimes } from "adhan";

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
