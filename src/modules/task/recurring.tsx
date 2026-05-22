import { useCallback } from "react";
import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useRecurringTaskList } from "./use-recurring-task-list";
import { LargeNavbar } from "../navigation/navbar";
import { HvRepeat } from "@/modules/icons";
import type { Task } from "@/domain/task";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTaskContext } from "./task-context";

export function Recurring() {
  const { t } = useLanguageContext();
  const { tasks, loading, error } = useRecurringTaskList();
  const { openEditTaskForm } = useTaskContext();

  const handleEditTask = useCallback(
    (task: Task) => {
      openEditTaskForm(task.id as string, task);
    },
    [openEditTaskForm]
  );

  const initiated = !loading;

  if (initiated && error) {
    return <ErrorDisplay error={error?.message ?? "Unknown error"} />;
  }

  return (
    <Page
      navbarLarge={<LargeNavbar title={t("recurring")} showBackButton={true} />}
    >
      <div className="overflow-y-auto">
        <div className={initiated ? "visible" : "invisible"}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<HvRepeat className="w-full h-full" />}
              title={t("no_recurring_tasks")}
              description={t("recurring_tasks_will_appear_here")}
            />
          ) : (
            <div>
              {tasks.map((task: Task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  showGoalInfo={false}
                  disableSwipe={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
