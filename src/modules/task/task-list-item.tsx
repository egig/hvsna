import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { HvSquare, HvCheckSquare2, HvCalendar, HvCheck } from "@/modules/icons";
import { useLocation } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useSnackbar } from "../components/snackbar-provider";
import type { Task, TaskStatus } from "@/domain/task";
import { useTaskListItem } from "./task-list-item-hook";
import { useTaskContext } from "./task-context";
import { isSameHijriDate, useHijriDate } from "../calendar/hijri";
import { TagList } from "./tag-input";
import { CalendarModal } from "../calendar/hijri-date-input/calendar-modal";
import { useTaskEpoch } from "./task-form-helpers";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
  formatDate?: (task: Task) => string;
  disableSwipe?: boolean;
}

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  showGoalInfo: _showGoalInfo = false,
  className = "",
  formatDate,
  disableSwipe = false,
}: TaskListItemProps) {
  const { completeTask, reopenTask } = useTaskListItem();
  const { updateTask, materializeVirtualTask } = useTaskContext();
  const location = useLocation();
  const { t } = useLanguageContext();
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const { getToday, toHijriDate } = useHijriDate();
  const getTaskEpoch = useTaskEpoch();

  const x = useMotionValue(0);
  const controls = useAnimation();
  const isDraggingRef = useRef(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const SWIPE_THRESHOLD = 60;
  const SWIPE_VELOCITY = 300;

  const snapBack = () =>
    controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 40 },
    });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 1:
        return (
          <HvCheckSquare2 strokeWidth={1} size={24} className="text-gray-400" />
        );
      case 0:
        return <HvSquare strokeWidth={1} size={24} className="text-gray-500" />;
      default:
        return <HvSquare strokeWidth={1} size={24} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 1:
        return "line-through text-gray-400";
      case 0:
        return "text-gray-800";
      default:
        return "text-gray-800";
    }
  };

  const formatScheduledDate = (
    task: Task,
    timeContext: "today" | "upcoming"
  ) => {
    if (typeof formatDate === "function") {
      return formatDate(task);
    }

    if (!task.atEpochMillis) return null;

    const today = getToday();
    const time = task.atTime;
    const taskDate = toHijriDate(new Date(task.atEpochMillis));
    if (isSameHijriDate(taskDate, today.previous())) {
      return t("yesterday") + (time ? `, ${time}` : "");
    }

    if (isSameHijriDate(taskDate, today)) {
      if (timeContext === "today") {
        return time ? time : "";
      }
      return t("today") + (time ? `, ${time}` : "");
    }

    if (isSameHijriDate(taskDate, today.next())) {
      return t("tomorrow") + (time ? `, ${time}` : "");
    }

    try {
      const todayGregorian = today.toDate();
      const taskGregorian = taskDate.toDate();
      const daysDiff = Math.floor(
        (taskGregorian.getTime() - todayGregorian.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDiff > 1 && daysDiff <= 7) {
        return taskDate.format("dddd") + (time ? `, ${time}` : "");
      }

      return taskDate.format("D MMMM") + (time ? `, ${time}` : "");
    } catch {
      return "";
    }
  };

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleStatusAction();
  };

  const handleStatusAction = async () => {
    let updatePromise: Promise<Task>;
    let nextStatus: TaskStatus;

    const activeTask = task.isVirtual
      ? await materializeVirtualTask(task)
      : task;

    if (activeTask.status === 0) {
      updatePromise = completeTask(activeTask.id as string);
      nextStatus = 1;
    } else {
      updatePromise = reopenTask(activeTask.id as string);
      nextStatus = 0;
    }

    updatePromise.then(() => {
      if (onStatusChange) {
        onStatusChange(task, nextStatus);
      }
    });

    const statusText = nextStatus === 1 ? t("complete") : t("pending");

    const snackbarId = showSnackbar(
      <div className="flex items-center justify-between w-full">
        <span>{`${t("status_changed_to")} ${statusText}`}</span>
        <button
          onClick={() => {
            if (activeTask.status === 0) {
              reopenTask(activeTask.id as string).then(() => {
                hideSnackbar(snackbarId);
              });
            } else {
              completeTask(activeTask.id as string).then(() => {
                hideSnackbar(snackbarId);
              });
            }
          }}
          className="flex items-center gap-1 px-1 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors ml-4"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {t("undo")}
        </button>
      </div>,
      { autoHideDuration: 5000 }
    );
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = async (_: PointerEvent, info: PanInfo) => {
    const isRightSwipe =
      info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY;
    const isLeftSwipe =
      info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY;

    if (isRightSwipe) {
      await snapBack();
      await handleStatusAction();
    } else if (isLeftSwipe) {
      await snapBack();
      setIsScheduleModalOpen(true);
    } else {
      snapBack();
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleItemClick = () => {
    if (isDraggingRef.current) return;
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleScheduleConfirm = (
    date: Date | null,
    recurringType: "none" | "daily" | "weekly" | "monthly" | "yearly",
    recurringInterval: number
  ) => {
    let atEpochMillis: number | null = null;
    if (date) {
      atEpochMillis = getTaskEpoch(date, (task.atTime as string) || "");
    }
    updateTask(task.id as string, {
      atEpochMillis,
      recurringType: recurringType ?? "none",
      recurringInterval: recurringInterval ?? 1,
    });
    setIsScheduleModalOpen(false);
  };

  const isOnTodayPage =
    location.pathname === "/today" || location.pathname === "/tasks";

  const contentBg = "bg-white hover:bg-gray-50";

  return (
    <motion.div
      className={`relative overflow-hidden w-full border-b border-gray-200 ${className}`}
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
    >
      {!disableSwipe && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-24 flex flex-col items-center justify-center bg-[var(--hvsna-success-color)] text-white select-none">
            <HvCheck size={22} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">
              {task.status === 0
                ? t("complete") || "Done"
                : t("reopen") || "Reopen"}
            </span>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-24 flex flex-col items-center justify-center bg-[var(--hvsna-primary-color)] text-white select-none">
            <HvCalendar size={22} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">
              {t("schedule") || "Schedule"}
            </span>
          </div>
        </>
      )}

      <motion.div
        className={`relative z-10 w-full px-6 py-4 transition-colors cursor-pointer ${contentBg}`}
        drag={disableSwipe ? false : "x"}
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.5}
        dragDirectionLock
        style={{ x }}
        animate={controls}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleItemClick}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={handleStatusClick}
            className="p-0 shrink-0 leading-none transition-transform hover:scale-110 cursor-pointer"
            style={{ marginTop: "1px" }}
            aria-label={`Change status from ${task.status}`}
            data-testid="status-toggle"
          >
            {getStatusIcon(task?.status || 0)}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`leading-6 ${getStatusColor(
                  task.status as TaskStatus
                )}`}
              >
                {task.name}
              </h3>
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}

            <p
              className={`text-xs mt-0.5 ${
                task.isOverdue() && task.status !== 1
                  ? "text-[var(--hvsna-danger-color)]"
                  : "text-gray-500"
              }`}
            >
              {formatScheduledDate(task, isOnTodayPage ? "today" : "upcoming")}
            </p>

            {task.tags && task.tags.length > 0 && (
              <TagList tags={task.tags} className="mt-1.5" />
            )}
          </div>
        </div>
      </motion.div>

      <CalendarModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        selectedDate={null}
        onConfirm={handleScheduleConfirm as any}
      />
    </motion.div>
  );
}

export default TaskListItem;
