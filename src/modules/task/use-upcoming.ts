import { useQuery } from "@tanstack/react-query";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import type { Task } from "src/modules/task/types";

export function useUpcoming() {
  const { getToday, getTomorrow, toHijriDate, formatDate, createHijriDate } =
    useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  const today = getToday();
  const tomorrow = today.next();
  const endOfWeek = today.endOfWeek();
  const tomorrowString = tomorrow.toString();
  const upcomingTasksQuery = useQuery({
    queryKey: queryKeys.upcomingTasks(tomorrowString),
    queryFn: () => taskUseCases.getUpcomingTasks(today),
  });

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
    const endOfWeek = today.endOfWeek().endOfDay();

    tasks.forEach((task) => {
      if (!task.atEpochMillis) {
        groups.unscheduled.tasks.push(task);
        return;
      }

      try {
        const taskDate = new Date(task.atEpochMillis);

        // Today
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

        if (taskDate > tomorrowStartOfDay && taskDate <= endOfWeek.toDate()) {
          groups.thisWeek.tasks.push(task);
          return;
        }

        // This month: same Hijri month as today
        const taskHijriDate = toHijriDate(taskDate);
        if (
          taskHijriDate.year === today.year &&
          taskHijriDate.month === today.month
        ) {
          groups.thisMonth.tasks.push(task);
          return;
        }

        // Later: everything else
        groups.later.tasks.push(task);
      } catch (error) {
        // If date parsing fails, put in unscheduled
        groups.unscheduled.tasks.push(task);
      }
    });

    return groups;
  };

  // Group tasks by time period (derived state)
  const groupedTasks = groupTasksByTimePeriod(upcomingTasksQuery.data || []);

  return {
    upcomingTasks: upcomingTasksQuery.data || [],
    taskGroups: groupedTasks,
    loading: upcomingTasksQuery.isPending,
    initiated: !upcomingTasksQuery.isPending,
    error: upcomingTasksQuery.error
      ? upcomingTasksQuery.error instanceof Error
        ? upcomingTasksQuery.error.message
        : "Unknown error"
      : null,
    refreshTasks: () => upcomingTasksQuery.refetch(),
    today,
    tomorrow,
    endOfWeek,
    formatDate,
  };
}
