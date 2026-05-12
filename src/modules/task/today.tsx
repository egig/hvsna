import TaskListItem from "./task-list-item";
import { ErrorDisplay } from "../components/error-display";
import { EmptyState } from "../components/empty-state";
import { useToday } from "./use-today";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import type { Task, PrayerTime } from "src/modules/task/types";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  HvChevronRight,
  HvChevronDown,
  HvCheck,
  HvWallet,
} from "@/modules/icons";
import { useTaskContext } from "./task-context";
import { useSettings } from "../settings/useSettings";
import {
  groupTasksByPrayerTimes,
  getPrayerTimesWithFallback,
} from "../prayer-time-utils";
import logger from "src/modules/logger";
import { Page } from "../navigation";
import { LargeNavbar } from "../navigation/navbar";

interface TodayTasksProps {
  tasks: Task[];
  completedTasks?: Task[];
}

export function TodayContent() {
  const { t } = useLanguageContext();
  const { todayTasks, todayCompletedTasks, error, initiated } = useToday();
  const { settings } = useSettings();
  const hasLocation = !!(
    settings.coordinate?.latitude && settings.coordinate?.longitude
  );

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  const isEmpty = todayTasks.length === 0 && todayCompletedTasks.length === 0;

  return (
    <div className={initiated ? "visible" : "invisible"}>
      {!hasLocation && (
        <a
          href="/settings/general"
          className="flex items-center gap-2 m-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm"
        >
          <span className="flex-1">
            {t("location_not_set_using_default") ||
              "Location not set — prayer times may be inaccurate."}
          </span>
          <span className="shrink-0 font-medium">
            {t("set_location") || "Set location →"}
          </span>
        </a>
      )}
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

  return (
    <Page
      navbarLarge={
        <LargeNavbar
          showBackButton={false}
          title={pageTitle}
          subtitle={subTitle}
        />
      }
    >
      <TodayContent />
    </Page>
  );
}

// Fallback function for original grouping logic (used while prayer times are loading)
const getOriginalTaskGroups = (
  tasks: Task[],
  completedTasks: Task[],
  getToday: any
) => {
  const groups: {
    prayer: PrayerTime | null;
    tasks: Task[];
    isOverdue?: boolean;
    isCompleted?: boolean;
    isTimeBased?: boolean;
    atTime?: string;
  }[] = [];

  const today = getToday();
  const todayStart = today.startOfDay().toDate().valueOf();

  const overdueTasks = tasks.filter(
    (task) => task.isOverdue() && !task.completedAt
  );
  const prayerTasks = tasks.filter(
    (task) =>
      task.usePrayerTime &&
      task.prayerTime &&
      (!task.atEpochMillis || task.atEpochMillis >= todayStart) &&
      !task.completedAt
  );
  const timeBasedTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      task.atTime &&
      (!task.atEpochMillis || task.atEpochMillis >= todayStart) &&
      !task.completedAt
  );
  const regularTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      !task.atTime &&
      (!task.atEpochMillis || task.atEpochMillis >= todayStart) &&
      !task.completedAt
  );

  if (overdueTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: overdueTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
      isOverdue: true,
    });
  }

  // Group prayer tasks by prayer time
  const prayerGroups: Record<PrayerTime, Task[]> = {
    Fajr: [],
    Sunrise: [],
    Dhuhr: [],
    Asr: [],
    Maghrib: [],
    Isha: [],
  };

  prayerTasks.forEach((task) => {
    if (task.prayerTime && prayerGroups[task.prayerTime]) {
      prayerGroups[task.prayerTime].push(task);
    }
  });

  const prayerOrder: PrayerTime[] = [
    "Maghrib",
    "Isha",
    "Fajr",
    "Sunrise",
    "Dhuhr",
    "Asr",
  ];
  prayerOrder.forEach((prayer) => {
    if (prayerGroups[prayer].length > 0) {
      groups.push({
        prayer,
        tasks: prayerGroups[prayer].sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
        ),
      });
    }
  });

  // Add each time-based task as its own entry, sorted by atTime
  timeBasedTasks
    .filter((task) => task.atTime)
    .sort((a, b) => {
      const [ah, am] = a.atTime!.split(":").map(Number);
      const [bh, bm] = b.atTime!.split(":").map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    })
    .forEach((task) => {
      groups.push({
        prayer: null,
        tasks: [task],
        isTimeBased: true,
        atTime: task.atTime,
      });
    });

  if (regularTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: regularTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
    });
  }

  if (completedTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: completedTasks.sort(
        (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
      ),
      isCompleted: true,
    });
  }

  return groups;
};

function TodayTasks({ tasks, completedTasks = [] }: TodayTasksProps) {
  const { openEditTaskForm } = useTaskContext();
  const { t } = useLanguageContext();
  const { getToday } = useHijriDate();
  const { settings } = useSettings();
  const [prayerTimings, setPrayerTimings] = useState<any>(null);
  const [, setLoadingPrayerTimes] = useState(true);

  // Load prayer times
  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        setLoadingPrayerTimes(true);
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        const timings = await getPrayerTimesWithFallback(settings, today);
        setPrayerTimings(timings);
      } catch (error) {
        logger.error("Failed to load prayer times:", error);
      } finally {
        setLoadingPrayerTimes(false);
      }
    };

    loadPrayerTimes();
  }, [settings]);

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
    if (!prayerTimings) {
      // Fallback to original logic if prayer times not loaded
      return getOriginalTaskGroups(tasks, completedTasks, getToday);
    }

    // Pass all tasks (active + completed) to the new grouping function
    return groupTasksByPrayerTimes(
      [...tasks, ...completedTasks],
      prayerTimings
    );
  }, [tasks, completedTasks, prayerTimings, getToday]);

  const getPrayerTimeDisplay = useCallback(
    (prayer: PrayerTime) => {
      const prayerName = t(prayer.toLowerCase());

      // Add actual prayer time if available and not using fallback
      if (prayerTimings && prayerTimings[prayer]) {
        const prayerTime = prayerTimings[prayer];
        return `${prayerName} (${prayerTime})`;
      }

      return prayerName;
    },
    [t, prayerTimings]
  );

  return (
    <div className="space-y-6">
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
