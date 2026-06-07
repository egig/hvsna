import { useState, useEffect, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  HvChevronRight,
  HvChevronDown,
  HvArrowLeft,
  HvArrowRight,
  HvGripVertical,
} from "@/modules/icons";
import { useSettings } from "../settings";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { useTaskContext } from "./task-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import {
  getPrayerTimesWithFallback,
  groupTasksByPrayerTimes,
} from "../prayer-time-utils";
import TaskListItem from "./task-list-item";
import type { Task, PrayerTime } from "@/domain/task";
import logger from "../logger";
import type { PrayerTimes } from "adhan";
import { usePrayerTimes } from "../prayer";

function toLocalDateStr(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

interface WeekViewProps {
  upcomingTasks: Task[];
  droppable?: boolean;
}

interface WeekViewColumnProps {
  day: Date;
  tasks: Task[];
  prayerTimings: PrayerTimes;
  isToday: boolean;
  droppable?: boolean;
}

function DraggableTaskCard({
  task,
  isCompleted,
  isOverdue,
  onEdit,
}: {
  task: Task;
  isCompleted: boolean;
  isOverdue: boolean;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id!,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-sm border bg-white dark:bg-gray-900 flex items-stretch",
        "shadow-xs hover:shadow-md transition-shadow overflow-hidden",
        isDragging ? "opacity-40" : "",
        isCompleted
          ? "border-gray-100 dark:border-gray-800 opacity-60"
          : isOverdue
          ? "border-red-200 dark:border-red-900"
          : "border-gray-200 dark:border-gray-700",
      ].join(" ")}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex items-center px-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 shrink-0 touch-none"
      >
        <HvGripVertical className="size-3" />
      </div>
      <div className="flex-1 min-w-0">
        <TaskListItem
          task={task}
          onEdit={onEdit}
          showGoalInfo={false}
          className="!border-b-0"
        />
      </div>
    </div>
  );
}

function WeekViewColumn({
  day,
  tasks,
  prayerTimings,
  isToday,
  droppable,
}: WeekViewColumnProps) {
  const { t } = useLanguageContext();
  const { openEditTaskForm } = useTaskContext();
  const { toHijriDate, formatDate } = useHijriDate();

  const dateStr = toLocalDateStr(day);
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    disabled: !droppable,
  });

  const handleEditTask = useCallback(
    (task: Task) => openEditTaskForm(task.id as string),
    [openEditTaskForm]
  );

  const gregorianMainLabel = dayjs(day).format("ddd D");
  const hijriDate = useMemo(() => toHijriDate(day), [day, toHijriDate]);
  const hijriSubLabel = formatDate(hijriDate, "D MMMM");

  const taskGroups = useMemo(() => {
    if (!prayerTimings) return [];
    return groupTasksByPrayerTimes(tasks);
  }, [tasks, prayerTimings]);

  const getPrayerLabel = useCallback(
    (prayer: PrayerTime) => {
      const name = t(prayer.toLowerCase());
      if (prayerTimings && (prayerTimings as any)[prayer]) {
        return `${name} · ${(prayerTimings as any)[prayer]}`;
      }
      return name;
    },
    [t, prayerTimings]
  );

  return (
    <div
      ref={setNodeRef}
      data-date={dateStr}
      className={[
        "flex flex-col min-w-[200px] flex-1 transition-colors border-r border-gray-100 dark:border-gray-800",
        isOver && droppable
          ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-200 dark:ring-blue-800 rounded"
          : "",
      ].join(" ")}
    >
      {/* Column header: Gregorian date as main title, Hijri as subtitle */}
      <div
        className={[
          "px-3 py-2.5 border-b-2 mb-2",
          isToday
            ? "border-[var(--hvsna-primary-color)]"
            : "border-gray-200 dark:border-gray-700",
        ].join(" ")}
      >
        <div
          className={[
            "text-sm font-bold leading-tight",
            isToday
              ? "text-[var(--hvsna-primary-color)] dark:text-primary-300"
              : "text-gray-800 dark:text-gray-100",
          ].join(" ")}
        >
          {gregorianMainLabel}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {hijriSubLabel}
        </div>
      </div>

      {/* Task groups */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {taskGroups.length === 0 ? (
          <div className="text-xs text-gray-300 dark:text-gray-600 text-center py-6">
            —
          </div>
        ) : (
          <div className="space-y-1">
            {taskGroups.map((group: any, idx: number) => {
              const groupKey =
                group.prayer ||
                (group.isOverdue
                  ? "overdue"
                  : group.isCompleted
                  ? "completed"
                  : group.isTimeBased
                  ? `time-${group.atTime}`
                  : `regular-${idx}`);

              const hasLabel =
                group.isOverdue || group.isCompleted || !!group.prayer;

              const taskCards = (
                <div className="space-y-1.5">
                  {group.tasks.map((task: Task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      isCompleted={!!group.isCompleted}
                      isOverdue={!!group.isOverdue}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              );

              if (!hasLabel) {
                return <div key={groupKey}>{taskCards}</div>;
              }

              const labelContent = group.isOverdue ? (
                <span className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">
                  {t("overdue")}
                </span>
              ) : group.isCompleted ? (
                <span className="text-[10px] font-semibold text-green-600 dark:text-green-500 uppercase tracking-wider">
                  {t("completed")}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {getPrayerLabel(group.prayer!)}
                </span>
              );

              return (
                <Collapsible.Root
                  key={groupKey}
                  defaultOpen={!group.isCompleted}
                >
                  <Collapsible.Trigger className="flex items-center gap-1 py-1 w-full cursor-pointer group rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors px-1">
                    <HvChevronRight className="size-2.5 shrink-0 text-gray-300 group-data-[panel-open]:hidden" />
                    <HvChevronDown className="size-2.5 shrink-0 text-gray-300 hidden group-data-[panel-open]:block" />
                    {labelContent}
                    {group.isCompleted && (
                      <span className="ml-1 text-[10px] text-gray-300 dark:text-gray-600">
                        ({group.tasks.length})
                      </span>
                    )}
                  </Collapsible.Trigger>
                  <Collapsible.Panel className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0">
                    <div className="pl-3 pt-1">{taskCards}</div>
                  </Collapsible.Panel>
                </Collapsible.Root>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function WeekView({ upcomingTasks, droppable }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { getTodayPrayerTimes } = usePrayerTimes();
  const prayerTimings = getTodayPrayerTimes();

  const days = useMemo(() => {
    const sunday = dayjs()
      .startOf("week")
      .add(weekOffset * 7, "day");
    return Array.from({ length: 7 }, (_, i) => sunday.add(i, "day").toDate());
  }, [weekOffset]);

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

  const weekLabel = useMemo(() => {
    const start = dayjs(days[0]);
    const end = dayjs(days[6]);
    if (start.month() === end.month()) {
      return `${start.format("D")} – ${end.format("D MMMM YYYY")}`;
    }
    return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
  }, [days]);

  const tasksForDay = useCallback(
    (day: Date) =>
      upcomingTasks.filter((task) => {
        if (!task.atEpochMillis) return false;
        return (
          toLocalDateStr(new Date(task.atEpochMillis)) === toLocalDateStr(day)
        );
      }),
    [upcomingTasks]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Week navigation bar — full width, does not scroll horizontally */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Previous week"
        >
          <HvArrowLeft className="size-4" />
        </button>

        <div className="flex items-center gap-2">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              This week
            </button>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {weekLabel}
          </span>
        </div>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Next week"
        >
          <HvArrowRight className="size-4" />
        </button>
      </div>

      {/* Columns — horizontally scrollable, each column has fixed width */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <div className="flex h-full">
          {days.map((day) => {
            const dateStr = toLocalDateStr(day);
            return (
              <WeekViewColumn
                key={dateStr}
                day={day}
                tasks={tasksForDay(day)}
                prayerTimings={prayerTimings}
                isToday={dateStr === todayStr}
                droppable={droppable}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
