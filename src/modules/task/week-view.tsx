import { useState, useEffect, useMemo, useCallback } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Collapsible } from "@base-ui/react/collapsible";
import {
  HvChevronRight,
  HvChevronDown,
  HvArrowLeft,
  HvArrowRight,
} from "@/modules/icons";
import { useSettings } from "../settings/useSettings";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { useTaskContext } from "./task-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import {
  getPrayerTimesWithFallback,
  groupTasksByPrayerTimes,
} from "../prayer-time-utils";
import TaskListItem from "./task-list-item";
import type { Task, PrayerTime } from "./types";
import logger from "../logger";

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
  prayerTimings: Record<string, string> | null;
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
  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({ id: task.id! });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={[
        "rounded-sm border bg-white dark:bg-gray-900",
        "shadow-xs hover:shadow-md transition-shadow",
        "cursor-grab active:cursor-grabbing select-none overflow-hidden",
        isDragging ? "opacity-40" : "",
        isCompleted
          ? "border-gray-100 dark:border-gray-800 opacity-60"
          : isOverdue
          ? "border-red-200 dark:border-red-900"
          : "border-gray-200 dark:border-gray-700",
      ].join(" ")}
    >
      <TaskListItem
        task={task}
        onEdit={onEdit}
        showGoalInfo={false}
        showDateTime={false}
        className="!border-b-0"
      />
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
  const { setNodeRef, isOver } = useDroppable({ id: dateStr, disabled: !droppable });

  const handleEditTask = useCallback(
    (task: Task) => openEditTaskForm(task.id as string),
    [openEditTaskForm]
  );

  const hijriDate = useMemo(() => toHijriDate(day), [day, toHijriDate]);
  const hijriMainLabel = formatDate(hijriDate, "D MMMM");
  const gregorianSubLabel = day.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const taskGroups = useMemo(() => {
    if (!prayerTimings) return [];
    return groupTasksByPrayerTimes(tasks, prayerTimings as any);
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
        "flex flex-col min-w-[200px] flex-1 transition-colors",
        isOver && droppable ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-200 dark:ring-blue-800 rounded" : "",
      ].join(" ")}
    >
      {/* Column header: Hijri date as main title, Gregorian as subtitle */}
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
          {hijriMainLabel}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {gregorianSubLabel}
        </div>
      </div>

      {/* Task groups */}
      <div className="px-2 pb-6">
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
  const { settings } = useSettings();
  const { toHijriDate, formatDate } = useHijriDate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [prayerTimings, setPrayerTimings] = useState<Record<
    string,
    string
  > | null>(null);

  useEffect(() => {
    const today = toLocalDateStr(new Date());
    getPrayerTimesWithFallback(settings, today)
      .then((timings) => setPrayerTimings(timings as any))
      .catch((err) => logger.error("Failed to load prayer times:", err));
  }, [settings]);

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

  const weekLabel = useMemo(() => {
    const h0 = toHijriDate(days[0]);
    const h6 = toHijriDate(days[6]);
    const sameMonth = h0.month === h6.month && h0.year === h6.year;
    if (sameMonth) {
      return `${formatDate(h0, "D")} – ${formatDate(h6, "D MMMM YYYY")}`;
    }
    return `${formatDate(h0, "D MMMM")} – ${formatDate(h6, "D MMMM YYYY")}`;
  }, [days, toHijriDate, formatDate]);

  const tasksForDay = useCallback(
    (day: Date) =>
      upcomingTasks.filter((task) => {
        if (!task.atEpochMillis) return false;
        return toLocalDateStr(new Date(task.atEpochMillis)) === toLocalDateStr(day);
      }),
    [upcomingTasks]
  );

  return (
    <div>
      {/* Week navigation bar — full width, does not scroll horizontally */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
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
      <div className="overflow-x-auto">
        <div className="flex">
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
