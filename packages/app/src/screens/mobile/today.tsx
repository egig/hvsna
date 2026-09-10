import TaskListItem from "@/modules/task/task-list-item";
import { TaskGroupCollapsible } from "@/modules/task/task-group-collapsible";
import { ErrorDisplay } from "@/modules/components/error-display";
import { EmptyState } from "@/modules/components/empty-state";
import { useToday } from "@/modules/task/use-today";
import {
  MockTimeProvider,
  MockTimeControl,
  useMockTime,
} from "@/modules/task/mock-time-context";
import type { Task, PrayerTime } from "@/domain/task";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useMemo, useCallback } from "react";
import { HvCheck, HvMaghrib } from "@/modules/icons";
import { PageMobile as Page } from "./page";
import { LargeNavbarMobile as LargeNavbar } from "./navbar-mobile";
import { usePrayerTimes } from "@/modules/prayer";
import type { PrayerTimes } from "adhan";
import { groupTasksByPrayerTimes } from "@/modules/prayer-time-utils";
import dayjs from "dayjs";

export function Today() {
  return (
    <MockTimeProvider>
      <TodayInner />
    </MockTimeProvider>
  );
}

function TodayInner() {
  const { pageTitle, subTitle } = useToday();

  return (
    <>
      <Page
        navbarLarge={
          <LargeNavbar
            showBackButton={false}
            eyebrow={subTitle}
            title={pageTitle}
          />
        }
      >
        <TodayContent />
      </Page>
      {/* <MockTimeControl /> */}
    </>
  );
}

export function TodayContent() {
  const { t } = useLanguageContext();
  const {
    todayTasks,
    todayCompletedTasks,
    error,
    initiated,
    isAfterMaghrib,
    endOfTodayEpoch,
    nextHijriLabel,
    tomorrowGregorianLabel,
  } = useToday();

  const { now: getNow } = useMockTime();
  const { getPrayerTimesForDate } = usePrayerTimes();
  const prayerTimings = getPrayerTimesForDate(getNow());

  const taskGroups = useMemo(() => {
    let g = groupTasksByPrayerTimes(todayTasks, endOfTodayEpoch, prayerTimings);
    if (todayCompletedTasks.length) {
      g.push({
        label: "completed",
        // @ts-ignore
        isCompleted: true,
        tasks: todayCompletedTasks,
      });
    }
    return g;
  }, [todayTasks, todayCompletedTasks, endOfTodayEpoch]);

  // Index of the first Maghrib group — hairline goes before it
  const hairlineIndex = useMemo(() => {
    if (isAfterMaghrib) return -1;
    return taskGroups.findIndex((g: any) => g.prayer === "Maghrib");
  }, [taskGroups, isAfterMaghrib]);

  // Index of the first tomorrow group — divider goes before it
  const tomorrowDividerIndex = useMemo(() => {
    if (!isAfterMaghrib) return -1;
    return taskGroups.findIndex((g: any) => g.isTomorrow);
  }, [taskGroups, isAfterMaghrib]);

  const getPrayerTimeDisplay = useCallback(
    (prayer: PrayerTime) => {
      const prayerName = t(prayer.toLowerCase());
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

  if (initiated && error) return <ErrorDisplay error={error} />;

  const isEmpty = todayTasks.length === 0 && todayCompletedTasks.length === 0;

  if (!initiated) return null;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<HvCheck className="w-full h-full" />}
        title={t("no_tasks_scheduled_for_today")}
        description={t("tasks_scheduled_for_today_will_appear_here")}
      />
    );
  }

  return (
    <TodayTasks
      taskGroups={taskGroups}
      hairlineIndex={hairlineIndex}
      tomorrowDividerIndex={tomorrowDividerIndex}
      nextHijriLabel={nextHijriLabel}
      tomorrowGregorianLabel={tomorrowGregorianLabel}
      getPrayerTimeDisplay={getPrayerTimeDisplay}
    />
  );
}

interface TodayTasksProps {
  taskGroups: any[];
  hairlineIndex: number;
  tomorrowDividerIndex: number;
  nextHijriLabel: string;
  tomorrowGregorianLabel: string;
  getPrayerTimeDisplay: (prayer: PrayerTime) => string;
}

interface TaskGroupLabelProps {
  group: any;
  getPrayerTimeDisplay: (prayer: PrayerTime) => string;
}

function TaskGroupLabel({ group, getPrayerTimeDisplay }: TaskGroupLabelProps) {
  const { t } = useLanguageContext();

  const label = group.isOverdue
    ? t("overdue")
    : group.isCompleted
    ? t("completed")
    : group.isEndOfDay
    ? t("end_of_day")
    : getPrayerTimeDisplay(group.prayer!);

  const colorClass = group.isOverdue
    ? "text-danger-700"
    : group.isCompleted
    ? "text-gray-500"
    : group.isEndOfDay
    ? "text-gray-500"
    : "text-gray-700 dark:text-gray-300";

  return <span className={`text-sm font-bold ${colorClass}`}>{label}</span>;
}

function TodayTasks({
  taskGroups,
  hairlineIndex,
  tomorrowDividerIndex,
  nextHijriLabel,
  tomorrowGregorianLabel,
  getPrayerTimeDisplay,
}: TodayTasksProps) {
  const { t } = useLanguageContext();

  return (
    <div className="space-y-2">
      {taskGroups.map((group: any, groupIndex: number) => {
        const hasLabel = group.isOverdue || group.isCompleted || !!group.prayer;

        const taskNodes = (
          <div className="">
            {group.tasks.map((task: Task) => (
              <TaskListItem
                key={task.id}
                task={task}
                showGoalInfo={false}
                className="transition-all hover:shadow-sm"
              />
            ))}
          </div>
        );

        const groupKey =
          group.prayer ||
          (group.isOverdue
            ? "overdue"
            : group.isCompleted
            ? "completed"
            : group.isTimeBased
            ? `time-${group.atTime}`
            : `regular-${groupIndex}`);

        return (
          <div key={groupKey} className="mb-2">
            {groupIndex === 0 && groupIndex === hairlineIndex && (
              <p className="p-6 text-gray-500 text-base">
                {t("no_tasks_until_sunset")}.
              </p>
            )}
            {groupIndex === hairlineIndex && (
              <SunsetHairline nextHijriLabel={nextHijriLabel} />
            )}
            {groupIndex === 0 && groupIndex === tomorrowDividerIndex && (
              <p className="p-6 text-gray-500 text-base">
                {t("no_tasks_until_tomorrow")}.
              </p>
            )}
            {groupIndex === tomorrowDividerIndex && (
              <TomorrowDivider label={tomorrowGregorianLabel} />
            )}
            {!hasLabel ? (
              <div>{taskNodes}</div>
            ) : (
              <TaskGroupCollapsible
                key={groupKey}
                defaultOpen={!group.isCompleted}
                label={
                  <TaskGroupLabel
                    group={group}
                    getPrayerTimeDisplay={getPrayerTimeDisplay}
                  />
                }
                count={group.isCompleted ? group.tasks.length : undefined}
              >
                {taskNodes}
              </TaskGroupCollapsible>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SunsetHairline({ nextHijriLabel }: { nextHijriLabel: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5 px-0.5">
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#dd7d5f] whitespace-nowrap">
        <HvMaghrib size={20} />
        {nextHijriLabel}
      </span>
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function TomorrowDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5 px-0.5">
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#5d5882] dark:text-gray-400 whitespace-nowrap">
        {label}
      </span>
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
