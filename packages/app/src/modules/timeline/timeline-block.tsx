import React, { useCallback, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { HvSquare, HvSquareCheckFilled } from "@/modules/icons";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useSnackbar } from "@/modules/components/snackbar-provider";
import type { Task, TaskStatus } from "@/domain/task";
import { useTaskListItem } from "@/modules/task/task-list-item-hook";
import { useTaskContext } from "@/modules/task/task-context";
import { useTaskFormContext } from "@/modules/task/task-form-context";
import { useCompletionGrace } from "@/modules/task/completion-grace-context";
import {
  MIN_BLOCK_HEIGHT_PX,
  MIN_DURATION_MINUTES,
  SNAP_MINUTES,
  minutesToHeightPx,
  snapMinutesTo,
} from "./timeline-layout";

interface TimelineBlockProps {
  task: Task;
  /** "block": absolutely positioned on the hour grid (needs `style`). "row": full-width stacked row, for prayer boxes. */
  variant?: "block" | "row";
  style?: React.CSSProperties;
  /** Needed to convert resize-drag pixels into minutes — block variant only. */
  pxPerMinute?: number;
}

/**
 * Compact timeline entry: checkbox + truncated title only. Mirrors
 * TaskListItem's toggle-complete flow (materialize-if-virtual, grace
 * hold/release, undo snackbar) so completing a task here behaves exactly
 * like List mode — but skips `grace.suppress`/`retain`, since Timeline keeps
 * completed tasks in place rather than removing/regrouping them.
 *
 * Also draggable (dnd-kit, move-to-reschedule/unschedule — resolved by the
 * parent TimelineView, which owns the DndContext) and, for the block
 * variant, resizable from its bottom edge (plain Pointer Events — dnd-kit
 * isn't suited to a continuous single-axis resize) to change duration.
 *
 * "row" variant is for prayer-based tasks (`atTime` holds a bare prayer
 * name) rendered inside a `PrayerTaskBox` instead of positioned on the hour
 * grid — same checkbox/click/drag behavior, no border/background of its own
 * (the box supplies that) and no resize handle.
 */
export function TimelineBlock({ task, variant = "block", style, pxPerMinute }: TimelineBlockProps) {
  const { completeTask, reopenTask } = useTaskListItem();
  const { materializeVirtualTask, updateTask } = useTaskContext();
  const { openEditTaskForm } = useTaskFormContext();
  const { t } = useLanguageContext();
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const grace = useCompletionGrace();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id ?? ""),
    data: { task },
  });

  const resizeStartRef = useRef<{ startY: number; startDuration: number } | null>(null);
  const [previewDurationMinutes, setPreviewDurationMinutes] = useState<number | null>(null);

  const gracePhase = grace.phase(task.id ?? "");
  const done = task.status === 1 || gracePhase !== null;
  const overdue = task.isOverdue() && task.status !== 1;

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const activeTask = task.isVirtual ? await materializeVirtualTask(task) : task;
    let updatePromise: Promise<Task>;
    let nextStatus: TaskStatus;

    if (activeTask.status === 0) {
      grace.hold(activeTask);
      updatePromise = completeTask(activeTask.id as string);
      nextStatus = 1;
    } else {
      grace.release(activeTask.id as string);
      updatePromise = reopenTask(activeTask.id as string);
      nextStatus = 0;
    }
    void updatePromise;

    const statusText = nextStatus === 1 ? t("complete") : t("pending");
    const snackbarId = showSnackbar(
      <div className="flex items-center justify-between w-full">
        <span>{`${t("status_changed_to")} ${statusText}`}</span>
        <button
          onClick={() => {
            if (activeTask.status === 0) {
              grace.release(activeTask.id as string);
              reopenTask(activeTask.id as string).then(() => hideSnackbar(snackbarId));
            } else {
              grace.hold(activeTask);
              completeTask(activeTask.id as string).then(() => hideSnackbar(snackbarId));
            }
          }}
          className="flex items-center gap-1 px-1 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors ml-4"
        >
          {t("undo")}
        </button>
      </div>,
      { autoHideDuration: 5000 }
    );
  };

  const handleBodyClick = useCallback(() => {
    openEditTaskForm(task.id as string, task.isVirtual ? task : undefined);
  }, [task, openEditTaskForm]);

  const commitDuration = useCallback(
    async (durationMinutes: number) => {
      const activeTask = task.isVirtual ? await materializeVirtualTask(task) : task;
      await updateTask(activeTask.id as string, { durationMinutes });
    },
    [task, materializeVirtualTask, updateTask]
  );

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const startDuration = task.durationMinutes ?? MIN_DURATION_MINUTES;
    resizeStartRef.current = { startY: e.clientY, startDuration };
    setPreviewDurationMinutes(startDuration);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    const start = resizeStartRef.current;
    if (!start || !pxPerMinute) return;
    const deltaMinutes = (e.clientY - start.startY) / pxPerMinute;
    setPreviewDurationMinutes(
      snapMinutesTo(start.startDuration + deltaMinutes, SNAP_MINUTES, MIN_DURATION_MINUTES)
    );
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    const start = resizeStartRef.current;
    resizeStartRef.current = null;
    const finalDuration = previewDurationMinutes;
    setPreviewDurationMinutes(null);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    if (!start || finalDuration == null || finalDuration === start.startDuration) return;
    void commitDuration(finalDuration);
  };

  // Stop dnd-kit's move-drag (MouseSensor/TouchSensor, listening for
  // mousedown/touchstart on this block's root) from ever seeing the resize
  // handle's own gesture — Pointer Events' stopPropagation alone wouldn't
  // reach those, since mousedown/touchstart are separate native events.
  const stopMoveDragActivation = (e: React.SyntheticEvent) => e.stopPropagation();

  const borderClass = overdue && !done ? "border-danger-700" : "border-gray-200 dark:border-gray-700";
  const bgClass = done ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900";

  const wrapperClassName =
    variant === "row"
      ? "flex w-full text-left cursor-pointer touch-none rounded px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/60"
      : `absolute overflow-hidden rounded-md border px-1.5 py-0.5 text-left cursor-pointer touch-none ${borderClass} ${bgClass}`;

  const mergedStyle: React.CSSProperties | undefined =
    variant === "block"
      ? {
          ...style,
          ...(previewDurationMinutes != null && pxPerMinute
            ? { height: minutesToHeightPx(previewDurationMinutes, pxPerMinute, MIN_BLOCK_HEIGHT_PX) }
            : {}),
          opacity: isDragging ? 0.4 : undefined,
        }
      : { opacity: isDragging ? 0.4 : undefined };

  return (
    <div
      ref={setNodeRef}
      className={wrapperClassName}
      style={mergedStyle}
      onClick={handleBodyClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-1.5 min-w-0 h-full">
        <button
          onClick={handleStatusClick}
          className="shrink-0 leading-none transition-transform hover:scale-110 cursor-pointer"
          aria-label={`Change status from ${task.status}`}
        >
          {done ? (
            <HvSquareCheckFilled size={14} className="text-gray-400" />
          ) : (
            <HvSquare strokeWidth={1} size={14} className="text-gray-500" />
          )}
        </button>
        <span
          className={`truncate text-[11px] leading-tight ${
            done ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {task.name}
        </span>
      </div>

      {variant === "block" && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onMouseDown={stopMoveDragActivation}
          onTouchStart={stopMoveDragActivation}
          onClick={stopMoveDragActivation}
          className="absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize touch-none"
        />
      )}
    </div>
  );
}
