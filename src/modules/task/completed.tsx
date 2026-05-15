import { useCallback } from "react";
import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useCompletedTasks } from "./use-completed-tasks";
import { LargeNavbar } from "../navigation/navbar";
import { HvCheckCircle } from "@/modules/icons";
import type { Task } from "./types";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTaskContext } from "./task-context";

export function Completed() {
  const { t } = useLanguageContext();
  const { tasks, loading, error, handleInfiniteScroll } = useCompletedTasks();
  const { openEditTaskForm } = useTaskContext();

  const handleEditTask = useCallback(
    (task: Task) => {
      openEditTaskForm(task.id as string);
    },
    [openEditTaskForm]
  );

  const initiated = !loading;

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page
      navbarLarge={<LargeNavbar title={t("completed")} showBackButton={true} />}
    >
      <div
        className="tasks-scroll-container overflow-y-auto"
        onScroll={handleInfiniteScroll}
      >
        <div className={initiated ? "visible" : "invisible"}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<HvCheckCircle className="w-full h-full" />}
              title={t("no_completed_tasks")}
              description={t("completed_tasks_will_appear_here")}
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task: Task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  showGoalInfo={false}
                  className="transition-all hover:shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
