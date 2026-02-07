import { useTask } from "../modules/task/use-task";
import { CalendarIcon } from "lucide-react";
import type { Task } from "../lib/types/task";
import { Navbar } from "../modules/navigation/navbar";
import { Page } from "../modules/navigation";
import { LoadingSpinner } from "../components/loader";
import TaskListItem from "../components/task-list-item";
import { useUpcoming } from "../hooks/use-upcoming";

export default function Upcoming() {
  const { openTaskForm } = useTask();
  const { upcomingTasks, taskGroups, loading, initiated, error } =
    useUpcoming();

  const handleEditTask = (task: Task) => {
    openTaskForm(task.id);
  };

  return (
    <Page>
      <Navbar
        showBackButton={false}
        title="Upcoming"
        rightAction={<CalendarIcon size={24} className="text-gray-600" />}
      />

      <div className="h-[calc(100vh-160px)] overflow-y-auto">
        {initiated && error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Error: {error}</div>
          </div>
        )}

        {initiated && !loading && !error && upcomingTasks.length === 0 && (
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

        {initiated && !loading && !error && upcomingTasks.length > 0 && (
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
                ({ key }) =>
                  taskGroups[key as keyof typeof taskGroups] &&
                  taskGroups[key as keyof typeof taskGroups].length > 0,
              )
              .map(({ key, label }) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                    {label}
                  </h3>
                  <>
                    {taskGroups[key as keyof typeof taskGroups].map(
                      (task: Task) => (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                        />
                      ),
                    )}
                  </>
                </div>
              ))}
          </div>
        )}
      </div>
    </Page>
  );
}
