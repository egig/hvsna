import { CalendarIcon } from "lucide-react";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import TaskListItem from "../task/task-list-item";
import { useUpcoming } from "./use-upcoming";
import type { Task } from "src/modules/task/types";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "../task/task-context";

export default function Upcoming() {
  const { t } = useLanguageContext();
  const { openTaskForm } = useTaskContext();
  const { upcomingTasks, taskGroups, loading, initiated, error } =
    useUpcoming();

  const handleEditTask = (task: Task) => {
    openTaskForm(task.id);
  };

  return (
    <Page
    navbar={<Navbar showBackButton={false} title={t("upcoming")} />}
    >
        {initiated && error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              {t("error_colon", { error })}
            </div>
          </div>
        )}

        {initiated && !loading && !error && upcomingTasks.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t("no_upcoming_tasks")}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              {t("all_tasks_completed_or_no_pending")}
            </p>
          </div>
        )}

        {initiated && !loading && !error && upcomingTasks.length > 0 && (
          <div className="space-y-6">
            {[
              { key: "today", label: t("today") },
              { key: "tomorrow", label: t("tomorrow") },
              { key: "thisWeek", label: t("this_week") },
              { key: "thisMonth", label: t("this_month") },
              { key: "later", label: t("later") },
              { key: "unscheduled", label: t("unscheduled") },
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
    </Page>
  );
}
