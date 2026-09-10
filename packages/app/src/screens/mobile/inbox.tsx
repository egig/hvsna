import { PageMobile as Page } from "./page";
import TaskListItem from "@/modules/task/task-list-item";
import { ErrorDisplay } from "@/modules/components/error-display";
import { EmptyState } from "@/modules/components/empty-state";
import { useUnscheduled } from "@/modules/task/use-unscheduled";
import { LargeNavbarMobile as LargeNavbar } from "./navbar-mobile";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
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
