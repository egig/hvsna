import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useInbox } from "./use-inbox";
import { LargeNavbar } from "../navigation/navbar";
import type { Task } from "./types";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useCallback } from "react";
import { useTaskContext } from "./task-context";
import { HvOutlineInbox } from "@/modules/icons";

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

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page navbarLarge={<LargeNavbar title={pageTitle} />}>
      <div className={initiated ? "visible" : "invisible"}>
        {inboxTasks.length === 0 ? (
          <EmptyState
            icon={<HvOutlineInbox className="w-full h-full" />}
            title={t("no_tasks_in_inbox")}
            description={t("tasks_without_schedule_or_list_will_appear_here")}
          />
        ) : (
          <div className="space-y-2">
            {inboxTasks.map((task: Task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                showGoalInfo={false}
                className="transition-all hover:shadow-sm"
                showDateTime={false}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
