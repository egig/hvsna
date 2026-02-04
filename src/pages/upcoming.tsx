import { useEffect, useState } from "react";
import { useTasks } from "../modules/task/use-tasks";
import {
  CalendarIcon,
} from "lucide-react";
import type { Task } from "../lib/types/task";
import { Navbar } from "../modules/navigation/navbar";
import { Page } from "../modules/navigation";
import { LoadingSpinner } from "../components/loader";
import TaskListItem from "../components/task-list-item";
import { HijriDate } from "../lib/hijri";


export default function Upcoming() {
  const { tasks, loading, error, getTasks } = useTasks();
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  useEffect(() => {
    const filterUpcomingTasks = async () => {
      const allTasks = await getTasks();
      const today = HijriDate.fromDate(new Date());
      const todayString = `${today.year.toString().padStart(4, '0')}${today.month.toString().padStart(2, '0')}${today.day.toString().padStart(2, '0')}`;

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
      return date.format("YYYY M DD")
    } catch {
      return hijriDate;
    }
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};
    
    tasks.forEach((task) => {
      const dateKey = task.hijriDate || "unscheduled";
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    });

    return groups;
  };

  const taskGroups = groupTasksByDate(upcomingTasks);

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
          <div className="space-y-6 p-4">
            {Object.entries(taskGroups)
              .sort(([a], [b]) => {
                if (a === "unscheduled") return 1;
                if (b === "unscheduled") return -1;
                return a.localeCompare(b);
              })
              .map(([dateKey, dateTasks]) => (
                <div key={dateKey}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    {dateKey === "unscheduled" 
                      ? "Unscheduled" 
                      : formatScheduledDate(dateKey)
                    }
                  </h3>
                  <div className="space-y-2">
                    {dateTasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        className="border rounded-lg transition-all hover:shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Page>
  );
}
