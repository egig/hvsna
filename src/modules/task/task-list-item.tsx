import React, { useEffect, useState } from "react";
import { motion, time } from "framer-motion";
import {
  CircleIcon,
  CheckCircleIcon,
  Square,
  CheckSquareIcon,
  CheckSquare2,
} from "lucide-react";
import { useGoal } from "../goal/use-goal";
import { HijriDate } from "../calendar/hijri";
import { IoEllipseOutline } from "react-icons/io5";
import { useLocation } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useSnackbar } from "../../ui/snackbar-provider";
import type { Task, TaskStatus } from "./types";
import { useTaskListItem } from "./task-list-item-hook";
import { useSettings } from "src/modules/settings/useSettings";
import { useHijriCalendar } from "src/modules/calendar/hijri";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
  showDateTime?: boolean;
  formatDate?: (task: Task) => string;
}

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  showGoalInfo = false,
  className = "",
  showDateTime = false,
  formatDate,
}: TaskListItemProps) {
  const { goal } = useGoal(task.targetId || undefined);
  const { updateStatus, completeTask, reopenTask } = useTaskListItem();
  const location = useLocation();
  const { t } = useLanguageContext();
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const { getToday, createHijriDate } = useHijriCalendar();

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    switch (currentStatus) {
      case 0:
        return 1; // pending -> completed
      case 1:
        return 0; // completed -> pending
      default:
        return 0;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 1:
        return (
          <CheckSquare2 strokeWidth={1} size={24} className="text-gray-400" />
        );
      case 0:
        return <Square strokeWidth={1} size={24} className="text-gray-500" />;
      default:
        return <Square strokeWidth={1} size={24} className="text-gray-500" />;
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
    timeContext: "today" | "upcoming",
  ) => {
    if (typeof formatDate === "function") {
      return formatDate(task);
    }

    if (!task.atDateHijri) return null;

    const today = getToday();
    const yesterday = today.previous().format("YYYYMMDD");
    const tomorrow = today.next();
    const todayString = today.format("YYYYMMDD");
    const tomorrowString = tomorrow.format("YYYYMMDD");
    const time = task.atTime || task.prayerTime;

    if (task.atDateHijri === yesterday) {
      return t("yesterday") + (time ? `, ${time}` : "");
    }

    if (task.atDateHijri === todayString) {
      if (timeContext === "today") {
        return time ? time : "";
      }
      return t("today") + (time ? `, ${time}` : "");
    }

    if (task.atDateHijri === tomorrowString) {
      return t("tomorrow") + (time ? `, ${time}` : "");
    }

    // Check if within next 7 days
    try {
      const taskDate = createHijriDate(
        parseInt(task.atDateHijri.slice(0, 4)),
        parseInt(task.atDateHijri.slice(4, 6)) - 1,
        parseInt(task.atDateHijri.slice(6, 8)),
      );
      const todayGregorian = today.toDate();
      const taskGregorian = taskDate.toDate();
      const daysDiff = Math.floor(
        (taskGregorian.getTime() - todayGregorian.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // If within next 7 days (2-7 days from now)
      if (daysDiff > 1 && daysDiff <= 7) {
        return taskDate.format("dddd") + (time ? `, ${time}` : "");
      }

      // Otherwise show formatted date
      return taskDate.format("D MMMM") + (time ? `, ${time}` : "");
    } catch {
      return "";
    }
  };

  const getTargetInfo = (goal: any) => {
    if (!task.targetId || !showGoalInfo) return null;
    const targetName = goal?.name || "Unknown Goal";
    return `Goal: ${targetName}${task.targetValue ? ` (Value: ${task.targetValue})` : ""}`;
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    let updatePromise: Promise<Task>;
    let nextStatus: TaskStatus;

    if (task.status === 0) {
      // Complete the task
      updatePromise = completeTask(task.id);
      nextStatus = 1;
    } else {
      // Reopen the task
      updatePromise = reopenTask(task.id);
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
            // Revert the change
            if (task.status === 0) {
              reopenTask(task.id).then(() => {
                hideSnackbar(snackbarId);
              });
            } else {
              completeTask(task.id).then(() => {
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
      { autoHideDuration: 5000 },
    );
  };

  const handleItemClick = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const isOverdue = () => {
    // TOOD check if use use time or not
    return (
      !!task.atEpochMillis &&
      task.atEpochMillis > 0 &&
      new Date().valueOf() > task.atEpochMillis
    );
  };

  return (
    <motion.div
      className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${className || ""}`}
      onClick={handleItemClick}
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
      layout
    >
      <div className="flex justify-start gap-2">
        <div>
          <button
            onClick={handleStatusClick}
            className="m-0 p-0 h-auto w-auto flex-shrink-0 mt-0.5 transition-transform hover:scale-110 cursor-pointer"
            aria-label={`Change status from ${task.status}`}
          >
            {getStatusIcon(task?.status || 0)}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`truncate ${getStatusColor(task.status)}`}>
            {task.name}
          </h3>

          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {showDateTime && !!task.atDateHijri && (
            <p
              className={`text-xs ${isOverdue() && task.status !== 1 ? "text-[var(--hvsna-danger-color)]" : "text-gray-500"} mt-1 line-clamp-2`}
            >
              {formatScheduledDate(task, location.state?.context)}
            </p>
          )}

          {getTargetInfo(goal) && (
            <p className="text-sm text-gray-500 mt-1 truncate">
              {getTargetInfo(goal)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TaskListItem;
