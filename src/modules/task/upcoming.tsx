import { useState } from "react";
import {
  HvCalendar,
  HvLayoutList,
  HvCalendarMonth,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "../task/task-list-item";
import { useUpcoming } from "../task/use-upcoming";
import { WeekView } from "../task/week-view";
import type { Task } from "src/modules/task/types";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "../task/task-context";
import { useScreenSize } from "../components/screen-size-wrapper";

type ViewMode = "list" | "week";

export default function Upcoming() {
  const { t } = useLanguageContext();
  const { openEditTaskForm } = useTaskContext();
  const { isDesktop } = useScreenSize();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });

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
    today,
    tomorrow,
    endOfWeek,
    formatDate,
  } = useUpcoming();

  // Generate labels with translations
  const taskGroupsWithLabels = {
    ...taskGroups,
    today: {
      ...taskGroups.today,
      label: t("today"),
    },
    tomorrow: {
      ...taskGroups.tomorrow,
      label: t("tomorrow"),
    },
    thisWeek: {
      ...taskGroups.thisWeek,
      label: t("this_week"),
    },
    thisMonth: {
      ...taskGroups.thisMonth,
      label: t("this_month"),
    },
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

  return (
    <Page
      fluid={effectiveMode === "week"}
      navbar={
        <Navbar
          showBackButton={false}
          title={t("upcoming")}
          rightAction={viewToggle}
        />
      }
    >
      {initiated && error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{t("error_colon", { error })}</div>
        </div>
      )}

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
                  taskGroupsWithLabels[
                    key as keyof typeof taskGroupsWithLabels
                  ] &&
                  taskGroupsWithLabels[key as keyof typeof taskGroupsWithLabels]
                    .tasks.length > 0
              )
              .map(({ key, label }) => (
                <div key={key}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                    {taskGroupsWithLabels[
                      key as keyof typeof taskGroupsWithLabels
                    ].label || label}
                  </h3>
                  <>
                    {taskGroupsWithLabels[
                      key as keyof typeof taskGroupsWithLabels
                    ].tasks.map((task: Task) => (
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
    </Page>
  );
}
