import { Page } from "../navigation";
import TaskListItem from "../task/task-list-item";
import { ErrorDisplay } from "../../components/error-display";
import { useToday } from "src/modules/common/use-today";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { LargeNavbar } from "src/modules/navigation/navbar";
import type { Task, PrayerTime } from "src/modules/task/types";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useMemo, useCallback } from "react";
import { useTaskContext } from "../task/task-context";

interface TodayTasksProps {
  tasks: Task[];
  completedTasks?: Task[];
}

export function Today() {
  const { t } = useLanguageContext();
  const {
    todayTasks,
    todayCompletedTasks,
    error,
    pageTitle,
    subTitle,
    initiated,
  } = useToday();

  if (!initiated) {
    return null;
  }

  if (initiated && error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Page
    navbar={
      <LargeNavbar title={pageTitle} subtitle={subTitle} />
    }
    >
      {initiated && todayTasks.length === 0 && (
        <div className="p-4">
          <div className="text-gray-400 mb-2">
            {t("no_tasks_scheduled_for_today")}
          </div>
          <div className="text-gray-500 text-sm">
            {t("tasks_scheduled_for_today_will_appear_here")}
          </div>
        </div>
      )}

      <TodayTasks tasks={todayTasks} completedTasks={todayCompletedTasks} />
    </Page>
  );
}

function TodayTasks({ tasks, completedTasks = [] }: TodayTasksProps) {
  const { openTaskForm } = useTaskContext();
  const { t } = useLanguageContext();
  const { getToday } = useHijriDate();

  const handleEditTask = useCallback(
    (task: Task) => {
      openTaskForm(task.id);
    },
    [openTaskForm],
  );

  // Memoize task grouping to prevent unnecessary recalculations
  const taskGroups = useMemo(() => {
    const groups: {
      prayer: PrayerTime | null;
      tasks: Task[];
      isOverdue?: boolean;
      isCompleted?: boolean;
    }[] = [];

    const today = getToday();
    const todayStart = today.startOfDay().toDate().valueOf();

    // Separate overdue tasks, prayer-based tasks, and regular tasks
    const overdueTasks = tasks.filter((task) => task.isOverdue());
    const prayerTasks = tasks.filter(
      (task) =>
        task.usePrayerTime &&
        task.prayerTime &&
        (!task.atEpochMillis || task.atEpochMillis >= todayStart),
    );
    const regularTasks = tasks.filter(
      (task) =>
        !task.usePrayerTime &&
        (!task.atEpochMillis || task.atEpochMillis >= todayStart),
    );

    // Add overdue tasks group first (always at top)
    if (overdueTasks.length > 0) {
      groups.push({
        prayer: null,
        tasks: overdueTasks.sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
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

    // Add prayer groups in chronological order starting from Maghrib
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
            (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
          ),
        });
      }
    });

    // Add regular tasks at the end
    if (regularTasks.length > 0) {
      groups.push({
        prayer: null,
        tasks: regularTasks.sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0),
        ),
      });
    }

    // Add completed tasks at the very bottom
    if (completedTasks.length > 0) {
      groups.push({
        prayer: null,
        tasks: completedTasks.sort(
          (a, b) => (b.completedAt || 0) - (a.completedAt || 0),
        ),
        isCompleted: true,
      });
    }

    return groups;
  }, [tasks, completedTasks, getToday]);

  const getPrayerTimeDisplay = useCallback(
    (prayer: PrayerTime) => {
      return t(prayer.toLowerCase());
    },
    [t],
  );

  return (
    <div className="space-y-6">
      {taskGroups.map((group, groupIndex) => (
        <div key={group.prayer || `regular-${groupIndex}`}>
          {group.isOverdue ? (
            <div className="flex items-center gap-2 mb-2 px-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-red-400">
                {t("overdue")}
              </h3>
            </div>
          ) : group.isCompleted ? (
            <div className="flex items-center gap-2 mb-2 px-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-green-600">
                {t("completed")}
              </h3>
            </div>
          ) : group.prayer ? (
            <div className="flex items-center gap-2 mb-2 px-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {getPrayerTimeDisplay(group.prayer)}
              </h3>
            </div>
          ) : null}

          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                showGoalInfo={false}
                className="transition-all hover:shadow-sm"
                showDateTime={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
