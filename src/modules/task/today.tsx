import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useToday } from "./use-today";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import type { Task, PrayerTime } from "@/domain/task";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  HvChevronRight,
  HvChevronDown,
  HvCheck,
  HvMapPin,
} from "@/modules/icons";
import { useTaskContext } from "./task-context";
import { Page } from "../navigation";
import { LargeNavbar } from "../navigation/navbar";
import { useLocationContext } from "../location/context";
import { useNetworkContext } from "../network/context";
import { usePrayerTimes } from "../prayer";
import type { PrayerTimes } from "adhan";
import { groupTasksByPrayerTimes } from "../prayer-time-utils";
import dayjs from "dayjs";

interface TodayTasksProps {
  tasks: Task[];
  completedTasks?: Task[];
}

export function TodayContent() {
  const { t } = useLanguageContext();
  const { todayTasks, todayCompletedTasks, error, initiated } = useToday();

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  const isEmpty = todayTasks.length === 0 && todayCompletedTasks.length === 0;

  return (
    <div className={initiated ? "visible" : "invisible"}>
      {isEmpty ? (
        <EmptyState
          icon={<HvCheck className="w-full h-full" />}
          title={t("no_tasks_scheduled_for_today")}
          description={t("tasks_scheduled_for_today_will_appear_here")}
        />
      ) : (
        <TodayTasks tasks={todayTasks} completedTasks={todayCompletedTasks} />
      )}
    </div>
  );
}

export function Today() {
  const { pageTitle, subTitle } = useToday();
  const { location, ensureLocation, loading } = useLocationContext();
  const { isOnline, initiated: networkInit } = useNetworkContext();

  return (
    <Page
      navbarLarge={
        <LargeNavbar
          showBackButton={false}
          title={pageTitle}
          subtitle={subTitle}
          leftAction={
            <button
              onClick={async () => {
                await ensureLocation();
              }}
              className="flex gap-1 w-max px-4 text-sm cursor-pointer hover:bg-gray-100 py-2 text-gray-600 rounded-lg"
            >
              <HvMapPin size={20} /> {loading ? "Loading..." : location.name}
            </button>
          }
          rightAction={
            !isOnline &&
            networkInit && (
              <div className="text-sm text-gray-500 px-1 mr-3 rounded-sm border-1 border-gray-300">
                Offline
              </div>
            )
          }
        />
      }
    >
      <TodayContent />
    </Page>
  );
}

// Fallback function for original grouping logic (used while prayer times are loading)

function TodayTasks({ tasks, completedTasks = [] }: TodayTasksProps) {
  const { openEditTaskForm } = useTaskContext();
  const { t } = useLanguageContext();
  const { getToday } = useHijriDate();
  const { getTodayPrayerTimes } = usePrayerTimes();

  const prayerTimings = getTodayPrayerTimes();

  const { materializeVirtualTask } = useTaskContext();
  const handleEditTask = useCallback(
    async (task: Task) => {
      const realTask = task.isVirtual
        ? await materializeVirtualTask(task)
        : task;
      openEditTaskForm(realTask.id as string);
    },
    [openEditTaskForm, materializeVirtualTask]
  );

  // Use new prayer time grouping logic
  const taskGroups = useMemo(() => {
    return groupTasksByPrayerTimes(tasks, prayerTimings);
  }, [tasks, completedTasks, prayerTimings, getToday]);

  const getPrayerTimeDisplay = useCallback(
    (prayer: PrayerTime) => {
      const prayerName = t(prayer.toLowerCase());

      // Add actual prayer time if available and not using fallback
      if (
        prayerTimings &&
        prayerTimings[prayer.toLowerCase() as keyof PrayerTimes]
      ) {
        const prayerTime =
          prayerTimings[prayer.toLocaleLowerCase() as keyof PrayerTimes];
        return `${prayerName} (${dayjs(prayerTime as Date).format("hh:mm a")})`;
      }

      return prayerName;
    },
    [t, prayerTimings]
  );

  return (
    <div className="space-y-2">
      {taskGroups.map((group: any, groupIndex: number) => {
        const hasLabel = group.isOverdue || group.isCompleted || !!group.prayer;

        const tasks = (
          <div className="">
            {group.tasks.map((task: Task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                showGoalInfo={false}
                className="transition-all hover:shadow-sm"
              />
            ))}
          </div>
        );

        if (!hasLabel) {
          return <div key={`regular-${groupIndex}`}>{tasks}</div>;
        }

        const labelContent = group.isOverdue ? (
          <span className="text-sm font-bold text-gray-700 dark:text-red-400">
            {t("overdue")}
          </span>
        ) : group.isCompleted ? (
          <span className="text-sm font-bold text-gray-700 dark:text-green-600">
            {t("completed")}
          </span>
        ) : (
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {getPrayerTimeDisplay(group.prayer!)}
          </span>
        );

        return (
          <Collapsible.Root
            key={
              group.prayer ||
              (group.isOverdue
                ? "overdue"
                : group.isCompleted
                ? "completed"
                : group.isTimeBased
                ? `time-${group.atTime}`
                : `regular-${groupIndex}`)
            }
            defaultOpen={!group.isCompleted}
          >
            <Collapsible.Trigger className="flex items-center gap-1.5 mb-2 px-4 w-full cursor-pointer group rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 py-1 transition-colors duration-150">
              <HvChevronRight className="size-3.5 shrink-0 text-gray-500 group-data-[panel-open]:hidden" />
              <HvChevronDown className="size-3.5 shrink-0 text-gray-500 hidden group-data-[panel-open]:block" />
              {labelContent}
              {group.isCompleted && (
                <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                  ({group.tasks.length})
                </span>
              )}
            </Collapsible.Trigger>
            <Collapsible.Panel className="ml-4 overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0">
              {tasks}
            </Collapsible.Panel>
          </Collapsible.Root>
        );
      })}
    </div>
  );
}
