import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { useInbox } from "./use-inbox";
import { LargeNavbar } from "../navigation/navbar";
import type { Task } from "./types";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useCallback } from "react";
import { useTaskContext } from "./task-context";

export function Inbox() {
  const { t } = useLanguageContext();
  const { inboxTasks, error, pageTitle, subTitle, initiated, refetch } =
    useInbox();

  const { openEditTaskForm } = useTaskContext();

  const handleEditTask = useCallback(
    (task: Task) => {
      openEditTaskForm(task.id as string);
    },
    [openEditTaskForm]
  );

  if (!initiated) {
    return null;
  }

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page
      navbarLarge={<LargeNavbar showBackButton={false} title={pageTitle} />}
    >
      {initiated && inboxTasks.length === 0 && (
        <div className="p-4">
          <div className="text-gray-400 mb-2">{t("no_tasks_in_inbox")}</div>
          <div className="text-gray-500 text-sm">
            {t("tasks_without_schedule_or_list_will_appear_here")}
          </div>
        </div>
      )}

      {initiated && inboxTasks.length > 0 && (
        <div className="space-y-2">
          {inboxTasks.map((task: Task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              showGoalInfo={false}
              className="transition-all hover:shadow-sm"
              showDateTime={false} // Don't show date/time for inbox tasks
            />
          ))}
        </div>
      )}
    </Page>
  );
}
