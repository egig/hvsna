import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HvEdit, HvSquare, HvSquareCheckFilled } from "@/modules/icons";
import { useLocation } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useSnackbar } from "../components/snackbar-provider";
import type { Task, TaskStatus } from "@/domain/task";
import { useTaskListItem } from "./task-list-item-hook";
import { useTaskContext } from "./task-context";
import { useTaskFormContext } from "./task-form-context";
import { useCompletionGrace } from "./completion-grace-context";
import { TagList } from "./tag-pill";
import { useCombinedDateFormat } from "../calendar/use-combined-date-format";
import dayjs from "dayjs";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
  formatDate?: (task: Task) => string;
}

/**
 * The checkbox: a small "pop" when it flips to done, a straight settle back on
 * undo. Mirrors the Android `TaskCheckbox` micro-interaction.
 */
function TaskCheckbox({ done }: { done: boolean }) {
  return (
    <motion.span
      className="inline-flex leading-none"
      initial={false}
      animate={done ? { scale: [1, 1.28, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", times: [0, 0.45, 1] }}
    >
      {done ? (
        <HvSquareCheckFilled size={24} className="text-gray-400" />
      ) : (
        <HvSquare strokeWidth={1} size={24} className="text-gray-500" />
      )}
    </motion.span>
  );
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
  const grace = useCompletionGrace();
  const { formatCombinedDate } = useCombinedDateFormat();

  const gracePhase = grace.phase(task.id ?? "");
  // Treat a held row as done straight away so the pop + strike fire on click,
  // before the DB write / query refetch swaps in the completed snapshot.
  const done = task.status === 1 || gracePhase !== null;
  const leaving = gracePhase === "leaving";

  // Strike-through / pop should sweep on the transition to done, but snap
  // straight to full when a row simply mounts already-done (Completed section).
  // A grace-held row that replaces a just-materialized virtual task mounts
  // "done" too, yet should still animate — hence the phase check.
  const [showDone, setShowDone] = useState(() => done && gracePhase !== "held");
  useEffect(() => {
    setShowDone(done);
  }, [done]);

  const getStatusColor = (isDone: boolean) =>
    isDone ? "text-gray-400" : "text-gray-800";

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
    const combined = formatCombinedDate(task.atEpochMillis, {
      includeYear: taskDay.year() !== today.year(),
    });
    return combined + (time ? `, ${time}` : "");
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
      // Persist now, defer the visual removal (checkbox pop + strike sweep).
      grace.hold(activeTask);
      updatePromise = completeTask(activeTask.id as string);
      nextStatus = 1;
    } else {
      grace.release(activeTask.id as string);
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
              grace.release(activeTask.id as string);
              reopenTask(activeTask.id as string).then(() => {
                hideSnackbar(snackbarId);
              });
            } else {
              grace.hold(activeTask);
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

  const contentBg = "bg-white";

  return (
    <motion.div
      className={`relative overflow-hidden w-full border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${className}`}
      initial={false}
      animate={leaving ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      layout
    >
      <div
        className={`group relative z-10 w-full p-4 transition-colors cursor-pointer ${contentBg}`}
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
            <TaskCheckbox done={showDone} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm leading-6 transition-colors duration-200 ${getStatusColor(
                      showDone
                    )} ${showDone ? "line-through" : ""}`}
                  >
                    {task.name}
                  </h3>
                </div>

                {task.description && (
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <p
                  className={`text-xs mt-0.5 ${
                    task.isOverdue() && task.status !== 1
                      ? "text-[var(--hvsna-danger-color)]"
                      : "text-muted"
                  }`}
                >
                  {formatScheduledDate(task, isOnTodayPage ? "today" : "upcoming")}
                </p>

                {task.tags && task.tags.length > 0 && (
                  <TagList tags={task.tags} className="mt-1.5" />
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick();
                }}
                className="shrink-0 p-1.5 rounded-md text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 cursor-pointer"
                aria-label={t("edit")}
              >
                <HvEdit size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TaskListItem;
