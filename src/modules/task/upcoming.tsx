import { useState } from "react";
import {
  HvCalendar,
  HvLayoutList,
  HvCalendarMonth,
  HvOutlineInbox,
  HvHiInbox,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { PageTransition } from "../navigation/page-transition";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "../task/task-list-item";
import { useUpcoming } from "../task/use-upcoming";
import { useInbox } from "../task/use-inbox";
import { WeekView } from "../task/week-view";
import type { Task } from "src/modules/task/types";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "../task/task-context";
import { useScreenSize } from "../components/screen-size-wrapper";

type ViewMode = "list" | "week";
type MobileTab = "upcoming" | "inbox";

function UpcomingContent({
  upcomingTasks,
  taskGroupsWithLabels,
  isReady,
  effectiveMode,
  formatScheduledDate,
  handleEditTask,
  t,
}: {
  upcomingTasks: Task[];
  taskGroupsWithLabels: Record<string, { label: string; tasks: Task[] }>;
  isReady: boolean;
  effectiveMode: ViewMode;
  formatScheduledDate: (task: Task) => string;
  handleEditTask: (task: Task) => void;
  t: (key: string) => string;
}) {
  return (
    <div className={isReady ? "visible" : "invisible"}>
      {effectiveMode === "week" ? (
        <WeekView upcomingTasks={upcomingTasks} />
      ) : upcomingTasks.length === 0 ? (
        <EmptyState
          icon={<HvCalendar className="w-full h-full" />}
          title={t("no_upcoming_tasks")}
          description={t("all_tasks_completed_or_no_pending")}
        />
      ) : (
        <div className="space-y-6">
          {[
            { key: "today", label: t("today") },
            { key: "tomorrow", label: t("tomorrow") },
            { key: "thisWeek", label: t("this_week") },
            { key: "thisMonth", label: t("this_month") },
            { key: "later", label: t("later") },
          ]
            .filter(
              ({ key }) =>
                taskGroupsWithLabels[key] &&
                taskGroupsWithLabels[key].tasks.length > 0
            )
            .map(({ key, label }) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                  {taskGroupsWithLabels[key].label || label}
                </h3>
                <>
                  {taskGroupsWithLabels[key].tasks.map((task: Task) => (
                    <TaskListItem
                      showDateTime
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      formatDate={formatScheduledDate}
                    />
                  ))}
                </>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function InboxContent({
  inboxTasks,
  inboxInitiated,
  handleEditTask,
  t,
}: {
  inboxTasks: Task[];
  inboxInitiated: boolean;
  handleEditTask: (task: Task) => void;
  t: (key: string) => string;
}) {
  return (
    <div className={inboxInitiated ? "visible" : "invisible"}>
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
              showDateTime={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { t } = useLanguageContext();
  const { openEditTaskForm } = useTaskContext();
  const { isDesktop } = useScreenSize();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });
  const [activeTab, setActiveTab] = useState<MobileTab>("upcoming");

  const effectiveMode: ViewMode = isDesktop ? viewMode : "list";

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("upcoming-view-mode", mode);
  };

  const {
    upcomingTasks,
    taskGroups,
    loading,
    initiated,
    error,
    formatScheduledDate,
  } = useUpcoming();

  const {
    inboxTasks,
    initiated: inboxInitiated,
  } = useInbox();

  const taskGroupsWithLabels = {
    ...taskGroups,
    today: { ...taskGroups.today, label: t("today") },
    tomorrow: { ...taskGroups.tomorrow, label: t("tomorrow") },
    thisWeek: { ...taskGroups.thisWeek, label: t("this_week") },
    thisMonth: { ...taskGroups.thisMonth, label: t("this_month") },
    later: { ...taskGroups.later, label: t("later") },
    unscheduled: { ...taskGroups.unscheduled, label: t("unscheduled") },
  };

  const handleEditTask = (task: Task) => {
    openEditTaskForm(task.id as string);
  };

  const isReady = initiated && !loading && !error;

  const viewToggle = isDesktop && (
    <div className="flex gap-0.5">
      <button
        onClick={() => toggleMode("list")}
        title="List view"
        className={[
          "p-1.5 rounded-md transition-colors",
          effectiveMode === "list"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
        ].join(" ")}
      >
        <HvLayoutList className="size-4" />
      </button>
      <button
        onClick={() => toggleMode("week")}
        title="Week view"
        className={[
          "p-1.5 rounded-md transition-colors",
          effectiveMode === "week"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
        ].join(" ")}
      >
        <HvCalendarMonth className="size-4" />
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <PageTransition>
        <div className="flex h-full">
          {/* Main upcoming content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar
              showBackButton={false}
              title={t("upcoming")}
              rightAction={viewToggle}
            />
            <div className="flex-1 overflow-y-auto">
              <div className={effectiveMode === "week" ? "" : "max-w-2xl mx-auto w-full"}>
                {initiated && error && (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
                  </div>
                )}
                <UpcomingContent
                  upcomingTasks={upcomingTasks}
                  taskGroupsWithLabels={taskGroupsWithLabels}
                  isReady={isReady}
                  effectiveMode={effectiveMode}
                  formatScheduledDate={formatScheduledDate}
                  handleEditTask={handleEditTask}
                  t={t}
                />
              </div>
            </div>
          </div>

          {/* Inbox sidebar */}
          <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <HvHiInbox className="size-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("inbox") || "Inbox"}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InboxContent
                inboxTasks={inboxTasks}
                inboxInitiated={inboxInitiated}
                handleEditTask={handleEditTask}
                t={t}
              />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Mobile: tabbed view
  const mobileTabs = (
    <div className="sticky top-0 z-10 flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <button
        onClick={() => setActiveTab("upcoming")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2",
          activeTab === "upcoming"
            ? "border-[var(--hvsna-primary-color)] text-[var(--hvsna-primary-color)]"
            : "border-transparent text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        <HvCalendarMonth className="size-4" />
        {t("upcoming")}
      </button>
      <button
        onClick={() => setActiveTab("inbox")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2",
          activeTab === "inbox"
            ? "border-[var(--hvsna-primary-color)] text-[var(--hvsna-primary-color)]"
            : "border-transparent text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        <HvOutlineInbox className="size-4" />
        {t("inbox") || "Inbox"}
      </button>
    </div>
  );

  return (
    <Page
      navbar={
        <Navbar showBackButton={false} title={t("tasks")} />
      }
    >
      {mobileTabs}
      {initiated && error && activeTab === "upcoming" && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
        </div>
      )}
      {activeTab === "upcoming" && (
        <UpcomingContent
          upcomingTasks={upcomingTasks}
          taskGroupsWithLabels={taskGroupsWithLabels}
          isReady={isReady}
          effectiveMode="list"
          formatScheduledDate={formatScheduledDate}
          handleEditTask={handleEditTask}
          t={t}
        />
      )}
      {activeTab === "inbox" && (
        <InboxContent
          inboxTasks={inboxTasks}
          inboxInitiated={inboxInitiated}
          handleEditTask={handleEditTask}
          t={t}
        />
      )}
    </Page>
  );
}
