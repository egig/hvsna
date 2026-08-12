import { usePendingTasksInRange } from "./use-pending-tasks-in-range";
import { useVirtualTasks } from "./use-virtual-tasks";
import type { Task } from "@/domain/task";
import dayjs from "dayjs";

export type LaterGroup = { key: string; label: string; tasks: Task[] };

export function useUpcoming(horizonDays = 30) {
  const now = dayjs();
  const startOfToday = now.startOf("day").valueOf();
  const endOfToday = now.endOf("day").valueOf();
  const startOfTomorrow = now.add(1, "day").startOf("day").valueOf();
  const endOfTomorrow = now.add(1, "day").endOf("day").valueOf();
  const endOfWeek = now.endOf("week").valueOf();
  const endOfMonth = now.endOf("month").valueOf();
  const endEpoch = startOfToday + horizonDays * 24 * 60 * 60 * 1000;

  const pendingTasksQuery = usePendingTasksInRange(startOfToday, endEpoch);
  const virtualTaskQuery = useVirtualTasks(startOfToday, endEpoch);

  const groupTasksByTimePeriod = (tasks: Task[]) => {
    const fixed = {
      today: { tasks: [] as Task[], label: "" },
      tomorrow: { tasks: [] as Task[], label: "" },
      thisWeek: { tasks: [] as Task[], label: "" },
      thisMonth: { tasks: [] as Task[], label: "" },
      unscheduled: { tasks: [] as Task[], label: "" },
    };

    const laterMap = new Map<string, LaterGroup>();

    tasks.forEach((task) => {
      if (!task.atEpochMillis) {
        fixed.unscheduled.tasks.push(task);
        return;
      }

      const t = task.atEpochMillis;

      if (t >= startOfToday && t <= endOfToday) {
        fixed.today.tasks.push(task);
        return;
      }

      if (t >= startOfTomorrow && t <= endOfTomorrow) {
        fixed.tomorrow.tasks.push(task);
        return;
      }

      if (t > endOfTomorrow && t <= endOfWeek) {
        fixed.thisWeek.tasks.push(task);
        return;
      }

      if (t > endOfWeek && t <= endOfMonth) {
        fixed.thisMonth.tasks.push(task);
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
      laterMap.get(key)!.tasks.push(task);
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
