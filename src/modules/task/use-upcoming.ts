import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePendingTasksInRange } from "./use-pending-tasks-in-range";
import { useVirtualTasks } from "./use-virtual-tasks";
import type { Task } from "@/domain/task";

export type LaterGroup = { key: string; label: string; tasks: Task[] };

export function useUpcoming(horizonDays = 30) {
  const { getToday, toHijriDate, formatDate } = useHijriDate();

  const today = getToday();
  const tomorrow = today.next();
  const endOfWeek = today.endOfWeek();

  const startOfToday = today.startOfDay().toDate().valueOf();
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

    const todayStartOfDay = today.startOfDay().toDate();
    const tomorrowStartOfDay = today.next().startOfDay().toDate();
    const endOfWeekDate = today.endOfWeek().endOfDay();

    tasks.forEach((task) => {
      if (!task.atEpochMillis) {
        fixed.unscheduled.tasks.push(task);
        return;
      }

      try {
        const taskDate = new Date(task.atEpochMillis);

        if (taskDate >= todayStartOfDay && taskDate < tomorrowStartOfDay) {
          fixed.today.tasks.push(task);
          return;
        }

        if (
          taskDate >= tomorrowStartOfDay &&
          taskDate <
            new Date(tomorrowStartOfDay.getTime() + 24 * 60 * 60 * 1000)
        ) {
          fixed.tomorrow.tasks.push(task);
          return;
        }

        if (
          taskDate > tomorrowStartOfDay &&
          taskDate <= endOfWeekDate.toDate()
        ) {
          fixed.thisWeek.tasks.push(task);
          return;
        }

        const taskHijri = toHijriDate(taskDate);
        if (taskHijri.year === today.year && taskHijri.month === today.month) {
          fixed.thisMonth.tasks.push(task);
          return;
        }

        // Beyond thisMonth — group by Hijri month (same year) or Hijri year (future years)
        let key: string;
        let label: string;
        if (taskHijri.year === today.year) {
          key = `month_${taskHijri.year}_${String(taskHijri.month).padStart(
            2,
            "0"
          )}`;
          label = taskHijri.format("MMMM YYYY");
        } else {
          key = `year_${taskHijri.year}`;
          label = taskHijri.year.toString();
        }

        if (!laterMap.has(key)) {
          laterMap.set(key, { key, label, tasks: [] });
        }
        laterMap.get(key)!.tasks.push(task);
      } catch {
        fixed.unscheduled.tasks.push(task);
      }
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
    today,
    tomorrow,
    endOfWeek,
    formatDate,
  };
}
