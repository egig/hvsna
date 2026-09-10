import { PageDesktop as Page } from "./page";
import TaskListItem from "@/modules/task/task-list-item";
import { ErrorDisplay } from "@/modules/components/error-display";
import { EmptyState } from "@/modules/components/empty-state";
import { useRecurringTaskList } from "@/modules/task/use-recurring-task-list";
import { LargeNavbarDesktop as LargeNavbar } from "./navbar-desktop";
import { HvRepeat } from "@/modules/icons";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";

export function Recurring() {
  const { t } = useLanguageContext();
  const { tasks, loading, error } = useRecurringTaskList();

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
              {tasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  showGoalInfo={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
