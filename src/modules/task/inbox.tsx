import { Page } from "../navigation";
import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useUnscheduled } from "./use-unscheduled";
import { LargeNavbar } from "../navigation/navbar";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvOutlineInbox } from "@/modules/icons";

export function Inbox() {
  const { t } = useLanguageContext();
  const { inboxTasks, error, pageTitle, subTitle, initiated, refetch } =
    useUnscheduled();

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page
      navbarLarge={<LargeNavbar title={pageTitle} showBackButton={false} />}
    >
      <div className={initiated ? "visible" : "invisible"}>
        {inboxTasks.length === 0 ? (
          <EmptyState
            icon={<HvOutlineInbox className="w-full h-full" />}
            title={t("no_tasks_in_inbox")}
            description={t("tasks_without_schedule_or_list_will_appear_here")}
          />
        ) : (
          <div className="space-y-2">
            {inboxTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                showGoalInfo={false}
                className="transition-all hover:shadow-sm"
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
