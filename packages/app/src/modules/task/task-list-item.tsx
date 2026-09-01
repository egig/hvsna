import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { HvSquare, HvSquareCheckFilled } from "@/modules/icons";
import { useLocation } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useSnackbar } from "../components/snackbar-provider";
import type { Task, TaskStatus } from "@/domain/task";
import { useTaskListItem } from "./task-list-item-hook";
import { useTaskContext } from "./task-context";
import { useTaskFormContext } from "./task-form-context";
import { TagList } from "./tag-pill";
import dayjs from "dayjs";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
  formatDate?: (task: Task) => string;
}

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  showGoalInfo: _showGoalInfo = false,
  className = "",
  formatDate,
}: TaskListItemProps) {
  const { completeTask, reopenTask } = useTaskListItem();
  const { materializeVirtualTask } = useTaskContext();
  const { openEditTaskForm } = useTaskFormContext();
  const location = useLocation();
  const { t } = useLanguageContext();
  const { showSnackbar, hideSnackbar } = useSnackbar();

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 1:
        return <HvSquareCheckFilled size={24} className="text-gray-400" />;
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

    const time = task.atTime;
    const taskDay = dayjs(task.atEpochMillis).startOf("day");
    const today = dayjs().startOf("day");
    const daysDiff = taskDay.diff(today, "day");

    if (daysDiff === -1) {
      return t("yesterday") + (time ? `, ${time}` : "");
    }
    if (daysDiff === 0) {
      if (timeContext === "today") return time ?? "";
      return t("today") + (time ? `, ${time}` : "");
    }
    if (daysDiff === 1) {
      return t("tomorrow") + (time ? `, ${time}` : "");
    }
    if (daysDiff > 1 && daysDiff <= 7) {
      return (
        dayjs(task.atEpochMillis).format("dddd") + (time ? `, ${time}` : "")
      );
    }
    const dateFormat = taskDay.year() === today.year() ? "D MMMM" : "D MMMM YYYY";
    return taskDay.format(dateFormat) + (time ? `, ${time}` : "");
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

  const handleItemClick = async () => {
    if (onEdit) {
      onEdit(task);
    } else {
      handleEditTask();
    }
  };

  const handleEditTask = useCallback(() => {
    openEditTaskForm(task.id as string, task.isVirtual ? task : undefined);
  }, [task, openEditTaskForm]);

  const isOnTodayPage =
    location.pathname === "/today" || location.pathname === "/tasks";

  const contentBg = "bg-white hover:bg-gray-50";

  return (
    <motion.div
      className={`relative overflow-hidden w-full border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${className}`}
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      layout
    >
      <div
        className={`relative z-10 w-full px-4 py-2 transition-colors cursor-pointer ${contentBg}`}
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
      </div>
    </motion.div>
  );
}

export default TaskListItem;
