import { useEffect, useState } from "react";
import { useTasks } from "../modules/task/use-tasks";
import { useTask } from "../modules/task/use-task";
import { CalendarIcon } from "lucide-react";
import type { Task } from "../lib/types/task";
import { Navbar } from "../modules/navigation/navbar";
import { Page } from "../modules/navigation";
import { LoadingSpinner } from "../components/loader";
import TaskListItem from "../components/task-list-item";
import { HijriDate } from "../lib/hijri";

export default function Upcoming() {
  const { tasks, loading, error, getTasks } = useTasks();
  const { openTaskForm } = useTask();
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  const handleEditTask = (task: Task) => {
    openTaskForm(task.id);
  };

  useEffect(() => {
    const filterUpcomingTasks = async () => {
      const allTasks = await getTasks();
      const today = HijriDate.fromDate(new Date());
      const todayString = `${today.year.toString().padStart(4, "0")}${today.month.toString().padStart(2, "0")}${today.day.toString().padStart(2, "0")}`;

      const filtered = allTasks.filter((task) => {
        // Include tasks that are:
        // 1. Not completed
        // 2. Either scheduled for today or future, or have no date (unscheduled)
        if (task.status === "completed") return false;

        if (task.hijriDate) {
          return task.hijriDate >= todayString;
        }

        // Include unscheduled pending/in_progress tasks
        return true;
      });

      // Sort by date (unscheduled tasks last, then by date ascending)
      const sorted = filtered.sort((a, b) => {
        if (!a.hijriDate && !b.hijriDate) return 0;
        if (!a.hijriDate) return 1;
        if (!b.hijriDate) return -1;
        return a.hijriDate.localeCompare(b.hijriDate);
      });

      setUpcomingTasks(sorted);
    };

    filterUpcomingTasks();
  }, []);

  const formatScheduledDate = (hijriDate?: string) => {
    if (!hijriDate) return "No date set";

    try {
      const year = parseInt(hijriDate.substring(0, 4));
      const month = parseInt(hijriDate.substring(4, 6));
      const day = parseInt(hijriDate.substring(6, 8));
      const date = new HijriDate(year, month, day);
      return date.format("YYYY M DD");
    } catch {
      return hijriDate;
    }
  };

  const groupTasksByTimePeriod = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      thisMonth: [],
      later: [],
      unscheduled: [],
    };

    const today = HijriDate.fromDate(new Date());
    const tomorrow = today.next();

    tasks.forEach((task) => {
      if (!task.hijriDate) {
        groups.unscheduled.push(task);
        return;
      }

      try {
        const year = parseInt(task.hijriDate.substring(0, 4));
        const month = parseInt(task.hijriDate.substring(4, 6));
        const day = parseInt(task.hijriDate.substring(6, 8));
        const taskDate = new HijriDate(year, month, day);

        // Calculate days difference
        const todayGregorian = today.toDate();
        const taskGregorian = taskDate.toDate();
        const daysDiff = Math.floor(
          (taskGregorian.getTime() - todayGregorian.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Today
        if (
          taskDate.year === today.year &&
          taskDate.month === today.month &&
          taskDate.day === today.day
        ) {
          groups.today.push(task);
        }
        // Tomorrow
        else if (
          taskDate.year === tomorrow.year &&
          taskDate.month === tomorrow.month &&
          taskDate.day === tomorrow.day
        ) {
          groups.tomorrow.push(task);
        }
        // This week (next 6 days after today)
        else if (daysDiff > 1 && daysDiff <= 6) {
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

  const taskGroups = groupTasksByTimePeriod(upcomingTasks);

  return (
    <Page>
      <Navbar
        showBackButton={false}
        title="Upcoming"
        rightAction={<CalendarIcon size={24} className="text-gray-600" />}
      />

      <div className="h-[calc(100vh-160px)] overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Loading upcoming tasks..." />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Error: {error}</div>
          </div>
        )}

        {!loading && !error && upcomingTasks.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No upcoming tasks
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              All your tasks are completed or there are no pending tasks
            </p>
          </div>
        )}

        {!loading && !error && upcomingTasks.length > 0 && (
          <div className="space-y-6">
            {[
              { key: "today", label: "Today" },
              { key: "tomorrow", label: "Tomorrow" },
              { key: "thisWeek", label: "This Week" },
              { key: "thisMonth", label: "This Month" },
              { key: "later", label: "Later" },
              { key: "unscheduled", label: "Unscheduled" },
            ]
              .filter(
                ({ key }) => taskGroups[key] && taskGroups[key].length > 0,
              )
              .map(({ key, label }) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                    {label}
                  </h3>
                  <>
                    {taskGroups[key].map((task: Task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                      />
                    ))}
                  </>
                </div>
              ))}
          </div>
        )}
      </div>
    </Page>
  );
}
