import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { HvArrowLeft, HvArrowRight } from "@/modules/icons";
import { useHijriDate } from "../../modules/calendar/hijri/use-hijri-date";
import TaskListItem from "../../modules/task/task-list-item";
import { usePendingTasksInRange } from "../../modules/task/use-pending-tasks-in-range";
import { useVirtualTasks } from "../../modules/task/use-virtual-tasks";
import type { Task } from "@/domain/task";

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
  isToday: boolean;
  isPast?: boolean;
  droppable?: boolean;
}

function DraggableTaskCard({
  task,
  isCompleted,
  isOverdue,
}: {
  task: Task;
  isCompleted: boolean;
  isOverdue: boolean;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id!,
    data: { task },
  });

  return (
    <div
      {...listeners}
      {...attributes}
      ref={setNodeRef}
      className={[
        "rounded-lg border bg-white dark:bg-gray-900 cursor-grab",
        "hover:shadow-md transition-shadow overflow-hidden",
        isDragging ? "opacity-40" : "",
        isCompleted
          ? "border-gray-100 dark:border-gray-800 opacity-60"
          : isOverdue
          ? "border-red-200 dark:border-red-900"
          : "border-gray-200 dark:border-gray-700",
      ].join(" ")}
    >
      <TaskListItem task={task} showGoalInfo={false} className="!border-b-0" />
    </div>
  );
}

function WeekViewColumn({
  day,
  tasks,
  isToday,
  isPast,
  droppable,
}: WeekViewColumnProps) {
  const { toHijriDate, formatDate } = useHijriDate();

  const dateStr = toLocalDateStr(day);
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    disabled: !droppable,
  });

  const gregorianMainLabel = dayjs(day).format("ddd D");
  const hijriDate = useMemo(() => toHijriDate(day), [day, toHijriDate]);
  const hijriSubLabel = formatDate(hijriDate, "D MMMM");

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => (a.atEpochMillis ?? 0) - (b.atEpochMillis ?? 0)
      ),
    [tasks]
  );

  return (
    <div
      ref={setNodeRef}
      data-date={dateStr}
      className={[
        "flex flex-col min-w-[200px] flex-1 transition-colors border-r border-gray-100 dark:border-gray-800",
        isPast && !(isOver && droppable)
          ? "bg-gray-50/60 dark:bg-gray-900/40"
          : "",
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
            : isPast
            ? "border-gray-100 dark:border-gray-800"
            : "border-gray-200 dark:border-gray-700",
        ].join(" ")}
      >
        <div
          className={[
            "text-sm font-bold leading-tight",
            isToday
              ? "text-[var(--hvsna-primary-color)] dark:text-primary-300"
              : isPast
              ? "text-gray-400 dark:text-gray-600"
              : "text-gray-800 dark:text-gray-100",
          ].join(" ")}
        >
          {gregorianMainLabel}
        </div>
        <div
          className={[
            "text-xs mt-0.5",
            isPast
              ? "text-gray-300 dark:text-gray-700"
              : "text-gray-400 dark:text-gray-500",
          ].join(" ")}
        >
          {hijriSubLabel}
        </div>
      </div>

      {/* Tasks */}
      <div
        className={[
          "flex-1 overflow-y-auto px-2 pb-4",
          isPast ? "opacity-55" : "",
        ].join(" ")}
      >
        {sortedTasks.length === 0 ? (
          <div className="text-xs text-gray-300 dark:text-gray-600 text-center py-6">
            —
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                isCompleted={task.status === 1}
                isOverdue={
                  !!task.atEpochMillis &&
                  task.atEpochMillis < Date.now() &&
                  task.status !== 1
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function WeekView({ upcomingTasks, droppable }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => {
    const sunday = dayjs()
      .startOf("week")
      .add(weekOffset * 7, "day");
    return Array.from({ length: 7 }, (_, i) => sunday.add(i, "day").toDate());
  }, [weekOffset]);

  // The `upcomingTasks` prop is filtered to [today, today + horizon], so it
  // can't cover past weeks or weeks beyond the horizon. Query the visible
  // week's range directly instead and merge in whatever the prop provides.
  const weekStartEpoch = useMemo(
    () => dayjs(days[0]).startOf("day").valueOf(),
    [days]
  );
  const weekEndEpoch = useMemo(
    () => dayjs(days[6]).endOf("day").valueOf(),
    [days]
  );

  const weekPendingQuery = usePendingTasksInRange(weekStartEpoch, weekEndEpoch);
  const weekVirtualQuery = useVirtualTasks(weekStartEpoch, weekEndEpoch);

  const weekTasks = useMemo(() => {
    const inWeek = (task: Task) =>
      task.atEpochMillis != null &&
      task.atEpochMillis >= weekStartEpoch &&
      task.atEpochMillis <= weekEndEpoch;

    // Both persisted tasks and virtual recurring occurrences carry a stable
    // id (virtual ones are `vtask_<template>_<epoch>`), so dedupe by id. The
    // week-scoped queries are the source of truth; the prop only backfills
    // anything already loaded for the current week.
    const byId = new Map<string | number, Task>();
    for (const task of upcomingTasks) {
      if (task.id != null && inWeek(task)) byId.set(task.id, task);
    }
    for (const task of weekPendingQuery.data ?? []) {
      if (task.id != null) byId.set(task.id, task);
    }
    for (const task of weekVirtualQuery.data ?? []) {
      if (task.id != null) byId.set(task.id, task);
    }
    return Array.from(byId.values());
  }, [
    weekPendingQuery.data,
    weekVirtualQuery.data,
    upcomingTasks,
    weekStartEpoch,
    weekEndEpoch,
  ]);

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
      weekTasks.filter((task) => {
        if (!task.atEpochMillis) return false;
        return (
          toLocalDateStr(new Date(task.atEpochMillis)) === toLocalDateStr(day)
        );
      }),
    [weekTasks]
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
          <HvArrowLeft className="size-5" />
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
          <HvArrowRight className="size-5" />
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
                isToday={dateStr === todayStr}
                isPast={dateStr < todayStr}
                droppable={droppable}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
