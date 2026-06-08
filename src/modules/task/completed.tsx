import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useCompletedTasks } from "./use-completed-tasks";
import { LargeNavbar } from "../navigation/navbar";
import { HvCheckCircle } from "@/modules/icons";
import { useLanguageContext } from "../i18n/LanguageContext";

export function Completed() {
  const { t } = useLanguageContext();
  const { tasks, loading, error, loadMore, hasMore, isLoadingMore } =
    useCompletedTasks();

  const initiated = !loading;

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page
      navbarLarge={<LargeNavbar title={t("completed")} showBackButton={true} />}
    >
      <div className="tasks-scroll-container overflow-y-auto">
        <div className={initiated ? "visible" : "invisible"}>
          {tasks.length === 0 ? (
            <EmptyState
              icon={<HvCheckCircle className="w-full h-full" />}
              title={t("no_completed_tasks")}
              description={t("completed_tasks_will_appear_here")}
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  showGoalInfo={false}
                  className="transition-all hover:shadow-sm"
                />
              ))}
            </div>
          )}
          {isLoadingMore && (
            <div className="flex justify-center py-4 text-sm text-gray-400">
              {"Loading…"}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center mb-8">
              <button
                className="p-2 font-bold text-gray-500"
                onClick={loadMore}
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
