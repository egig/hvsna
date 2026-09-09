import { usePendingTasksInRange } from "./use-pending-tasks-in-range";
import { useVirtualTasks } from "./use-virtual-tasks";
import type { Task } from "@/domain/task";
import dayjs from "dayjs";

export type LaterGroup = { key: string; label: string; tasks: Task[] };

export function useUpcoming(horizonDays = 30) {
  const now = dayjs();
  // The upcoming list is "tomorrow onward" — today's tasks live on their own
  // screen, so the query window and every group here start at tomorrow.
  const startOfTomorrow = now.add(1, "day").startOf("day").valueOf();
  const endOfTomorrow = now.add(1, "day").endOf("day").valueOf();
  const endOfWeek = now.endOf("week").valueOf();
  const endOfMonth = now.endOf("month").valueOf();
  const endEpoch = startOfTomorrow + horizonDays * 24 * 60 * 60 * 1000;

  const pendingTasksQuery = usePendingTasksInRange(startOfTomorrow, endEpoch);
  const virtualTaskQuery = useVirtualTasks(startOfTomorrow, endEpoch);

  const groupTasksByTimePeriod = (tasks: Task[]) => {
    const fixed = {
      tomorrow: { tasks: [] as Task[], label: "" },
      thisWeek: { tasks: [] as Task[], label: "" },
      thisMonth: { tasks: [] as Task[], label: "" },
      unscheduled: { tasks: [] as Task[], label: "" },
    };

    const laterMap = new Map<string, LaterGroup>();

    // Daily/weekly recurring tasks can produce many occurrences inside a
    // single coarse group (e.g. every day of "this month") — only surface
    // the earliest occurrence per series within each group.
    const seenRecurringPerGroup = new Map<string, Set<string | number>>();
    const pushToGroup = (groupKey: string, bucket: Task[], task: Task) => {
      if (
        (task.recurringType === "daily" || task.recurringType === "weekly") &&
        task.recurringTaskId != null
      ) {
        let seen = seenRecurringPerGroup.get(groupKey);
        if (!seen) {
          seen = new Set();
          seenRecurringPerGroup.set(groupKey, seen);
        }
        if (seen.has(task.recurringTaskId)) return;
        seen.add(task.recurringTaskId);
      }
      bucket.push(task);
    };

    tasks.forEach((task) => {
      if (!task.atEpochMillis) {
        fixed.unscheduled.tasks.push(task);
        return;
      }

      const t = task.atEpochMillis;

      if (t >= startOfTomorrow && t <= endOfTomorrow) {
        pushToGroup("tomorrow", fixed.tomorrow.tasks, task);
        return;
      }

      if (t > endOfTomorrow && t <= endOfWeek) {
        pushToGroup("thisWeek", fixed.thisWeek.tasks, task);
        return;
      }

      if (t > endOfWeek && t <= endOfMonth) {
        pushToGroup("thisMonth", fixed.thisMonth.tasks, task);
        return;
      }

      // Beyond this month — group by Gregorian month or year
      const taskDate = dayjs(t);
      let key: string;
      let label: string;
      if (taskDate.year() === now.year()) {
        key = `month_${taskDate.year()}_${String(taskDate.month() + 1).padStart(
          2,
          "0"
        )}`;
        label = taskDate.format("MMMM YYYY");
      } else {
        key = `year_${taskDate.year()}`;
        label = taskDate.format("YYYY");
      }

      if (!laterMap.has(key)) {
        laterMap.set(key, { key, label, tasks: [] });
      }
      pushToGroup(key, laterMap.get(key)!.tasks, task);
    });

    const laterGroups = Array.from(laterMap.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    return { ...fixed, laterGroups };
  };

  const upcomingTasks = [
    ...(pendingTasksQuery.data ?? []),
    ...(virtualTaskQuery.data ?? []),
  ].sort((a, b) => {
    if (a.atEpochMillis == null && b.atEpochMillis == null) return 0;
    if (a.atEpochMillis == null) return 1;
    if (b.atEpochMillis == null) return -1;
    return a.atEpochMillis - b.atEpochMillis;
  });

  const groupedTasks = groupTasksByTimePeriod(upcomingTasks);

  return {
    upcomingTasks,
    taskGroups: groupedTasks,
    loading: pendingTasksQuery.isPending,
    isLoadingMore: pendingTasksQuery.isFetching || virtualTaskQuery.isFetching,
    initiated: !pendingTasksQuery.isPending,
    error: pendingTasksQuery.error
      ? pendingTasksQuery.error instanceof Error
        ? pendingTasksQuery.error.message
        : "Unknown error"
      : null,
    refreshTasks: () => pendingTasksQuery.refetch(),
  };
}
