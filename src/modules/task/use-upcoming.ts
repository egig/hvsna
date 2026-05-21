import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePendingTasks } from "./use-pending-tasks";
import { useVirtualTasks } from "./use-virtual-tasks";
import type { Task } from "@/domain/task";

export function useUpcoming() {
  const { getToday, toHijriDate, formatDate } = useHijriDate();

  const today = getToday();
  const tomorrow = today.next();
  const endOfWeek = today.endOfWeek();

  const pendingTasksQuery = usePendingTasks();
  const startOfToday = today.startOfDay().toDate().valueOf();
  const threeMonths = startOfToday + 90 * 24 * 60 * 60 * 1000;
  const virtualTaskQuery = useVirtualTasks(startOfToday, threeMonths);

  const groupTasksByTimePeriod = (
    tasks: Task[]
  ): {
    today: { tasks: Task[]; label: string };
    tomorrow: { tasks: Task[]; label: string };
    thisWeek: { tasks: Task[]; label: string };
    thisMonth: { tasks: Task[]; label: string };
    later: { tasks: Task[]; label: string };
    unscheduled: { tasks: Task[]; label: string };
  } => {
    const groups = {
      today: { tasks: [] as Task[], label: "" },
      tomorrow: { tasks: [] as Task[], label: "" },
      thisWeek: { tasks: [] as Task[], label: "" },
      thisMonth: { tasks: [] as Task[], label: "" },
      later: { tasks: [] as Task[], label: "" },
      unscheduled: { tasks: [] as Task[], label: "" },
    };

    const todayStartOfDay = today.startOfDay().toDate();
    const tomorrowStartOfDay = today.next().startOfDay().toDate();
    const endOfWeekDate = today.endOfWeek().endOfDay();

    tasks.forEach((task) => {
      if (!task.atEpochMillis) {
        groups.unscheduled.tasks.push(task);
        return;
      }

      try {
        const taskDate = new Date(task.atEpochMillis);

        if (taskDate >= todayStartOfDay && taskDate < tomorrowStartOfDay) {
          groups.today.tasks.push(task);
          return;
        }

        if (
          taskDate >= tomorrowStartOfDay &&
          taskDate <
            new Date(tomorrowStartOfDay.getTime() + 24 * 60 * 60 * 1000)
        ) {
          groups.tomorrow.tasks.push(task);
          return;
        }

        if (
          taskDate > tomorrowStartOfDay &&
          taskDate <= endOfWeekDate.toDate()
        ) {
          groups.thisWeek.tasks.push(task);
          return;
        }

        const taskHijriDate = toHijriDate(taskDate);
        if (
          taskHijriDate.year === today.year &&
          taskHijriDate.month === today.month
        ) {
          groups.thisMonth.tasks.push(task);
          return;
        }

        groups.later.tasks.push(task);
      } catch {
        groups.unscheduled.tasks.push(task);
      }
    });

    return groups;
  };

  // TODO paginate by date range
  const upcomingTasks = [
    ...(pendingTasksQuery.data ?? []).filter(
      (t) => !!t.atEpochMillis && t.atEpochMillis > new Date().valueOf()
    ),
    ...(virtualTaskQuery.data ?? []),
  ];
  const groupedTasks = groupTasksByTimePeriod(upcomingTasks);
  return {
    upcomingTasks,
    taskGroups: groupedTasks,
    loading: pendingTasksQuery.isPending,
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
