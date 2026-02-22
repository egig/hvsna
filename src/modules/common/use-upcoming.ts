import { useEffect, useState } from "react";
import { useTaskStore } from "../task/task-store";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";
import { useHijriCalendar } from "../calendar/hijri/useHijriCalendar";
import type { Task } from "src/modules/task/types";

export function useUpcoming() {
  const { loading, error, upcommingTasks, loadUpcommingTasks } = useTaskStore();
  const { getToday, getTomorrow, toHijriDate, formatDate, createHijriDate } =
    useHijriCalendar();
  const [initiated, setInitiated] = useState(false);
  const [groupedTasks, setGroupedTasks] = useState<{
    today: Task[];
    tomorrow: Task[];
    thisWeek: Task[];
    thisMonth: Task[];
    later: Task[];
    unscheduled: Task[];
  }>({
    today: [],
    tomorrow: [],
    thisWeek: [],
    thisMonth: [],
    later: [],
    unscheduled: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setInitiated(true);
      loadUpcommingTasks();
    };
    loadData();
  }, []);

  useEffect(() => {
    setGroupedTasks(groupTasksByTimePeriod(upcommingTasks));
  }, [upcommingTasks]);

  const formatScheduledDate = (hijriDate?: string) => {
    if (!hijriDate) return "No date set";

    try {
      const year = parseInt(hijriDate.substring(0, 4));
      const month = parseInt(hijriDate.substring(4, 6));
      const day = parseInt(hijriDate.substring(6, 8));
      const hijriDateObj = createHijriDate(year, month, day);
      return formatDate(hijriDateObj, "YYYY M DD");
    } catch {
      return hijriDate;
    }
  };

  const groupTasksByTimePeriod = (
    tasks: Task[],
  ): {
    today: Task[];
    tomorrow: Task[];
    thisWeek: Task[];
    thisMonth: Task[];
    later: Task[];
    unscheduled: Task[];
  } => {
    const groups = {
      today: [] as Task[],
      tomorrow: [] as Task[],
      thisWeek: [] as Task[],
      thisMonth: [] as Task[],
      later: [] as Task[],
      unscheduled: [] as Task[],
    };

    const today = getToday();
    const tomorrow = getTomorrow();
    const todayGregorian = today.toDate();
    const todayString = `${today.year.toString().padStart(4, "0")}${today.month.toString().padStart(2, "0")}${today.day.toString().padStart(2, "0")}`;

    tasks.forEach((task) => {
      if (!task.atDateHijri) {
        groups.unscheduled.push(task);
        return;
      }

      try {
        // Early string comparison for today/tomorrow to avoid expensive date parsing
        if (task.atDateHijri === todayString) {
          groups.today.push(task);
          return;
        }

        const tomorrowString = `${tomorrow.year.toString().padStart(4, "0")}${tomorrow.month.toString().padStart(2, "0")}${tomorrow.day.toString().padStart(2, "0")}`;
        if (task.atDateHijri === tomorrowString) {
          groups.tomorrow.push(task);
          return;
        }

        const year = parseInt(task.atDateHijri.substring(0, 4));
        const month = parseInt(task.atDateHijri.substring(4, 6));
        const day = parseInt(task.atDateHijri.substring(6, 8));
        const taskDate = createHijriDate(year, month, day);
        const taskGregorian = taskDate.toDate();
        const daysDiff = Math.floor(
          (taskGregorian.getTime() - todayGregorian.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // This week (next 6 days after today)
        if (daysDiff > 1 && daysDiff <= 6) {
          groups.thisWeek.push(task);
        }
        // This month
        else if (
          taskDate.year === today.year &&
          taskDate.month === today.month
        ) {
          groups.thisMonth.push(task);
        }
        // Later
        else {
          groups.later.push(task);
        }
      } catch (error) {
        // If date parsing fails, put in unscheduled
        groups.unscheduled.push(task);
      }
    });

    return groups;
  };

  return {
    upcomingTasks: upcommingTasks,
    taskGroups: groupedTasks,
    loading,
    initiated,
    error,
    formatScheduledDate,
    refreshTasks: loadUpcommingTasks,
  };
}
