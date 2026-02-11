import React, { useEffect, useState } from "react";
import { motion, time } from "framer-motion";
import {
  CircleIcon,
  CheckCircleIcon,
  Square,
  CheckSquareIcon,
  CheckSquare2,
} from "lucide-react";
import type { Task, TaskStatus } from "../lib/types/task";
import { useGoal } from "../modules/goal/use-goal";
import { HijriDate } from "src/lib/hijri";
import { useTaskListItem } from "src/modules/task/task-list-item-hook";
import { IoEllipseOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { CustomToast } from "./custom-toast";
import { useLocation } from "react-router";
import { useLanguageContext } from "src/contexts/LanguageContext";

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
  showGoalInfo = true,
  className,
  showDateTime = false,
  formatDate,
}: TaskListItemProps) {
  const { goal } = useGoal(task.targetId || undefined);
  const { updateStatus } = useTaskListItem();
  const location = useLocation();
  const { t } = useLanguageContext();

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    switch (currentStatus) {
      case 0:
        return 1;
      case 1:
        return 0;
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

    const today = HijriDate.fromDate(new Date());
    const yesterday = today.previous().format("YYYYMMDD");
    const tomorrow = today.next();
    const todayString = today.format("YYYYMMDD");
    const tomorrowString = tomorrow.format("YYYYMMDD");
    const time = task.atTime;

    // Check if today
    if (task.atDateHijri === yesterday) {
      return t("yesterday") + (time ? `, ${time}` : "");
    }

    // Check if today
    if (task.atDateHijri === todayString) {
      if (timeContext === "today") {
        return time ? time : "";
      }
      return t("today") + (time ? `, ${time}` : "");
    }

    // Check if tomorrow
    if (task.atDateHijri === tomorrowString) {
      return t("tomorrow") + (time ? `, ${time}` : "");
    }

    // Check if within next 7 days
    try {
      const taskDate = new HijriDate(
        parseInt(task.atDateHijri.slice(0, 4)),
        parseInt(task.atDateHijri.slice(4, 6)),
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
      return task.atDateHijri;
    }
  };

  const getTargetInfo = (goal: any) => {
    if (!task.targetId || !showGoalInfo) return null;
    const targetName = goal?.name || "Unknown Goal";
    return `Goal: ${targetName}${task.targetValue ? ` (Value: ${task.targetValue})` : ""}`;
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = getNextStatus(task.status);
    const updatePromise = updateStatus(task.id, nextStatus).then(() => {
      if (onStatusChange) {
        onStatusChange(task, nextStatus);
      }
    });

    const statusText = nextStatus === 1 ? "complete" : "pending";

    toast(
      (t) => (
        <CustomToast
          message={`Status changed to ${statusText}`}
          onUndo={() => {
            updateStatus(task.id, task.status).then(() => {
              //..
            });
            toast.dismiss(t.id);
          }}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      {
        duration: 5000,
      },
    );
  };

  const handleItemClick = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const isOverdue = () => {
    return (
      !!task.atEpochMillis &&
      task.atEpochMillis > 0 &&
      new Date().valueOf() > task.atEpochMillis
    );
  };

  return (
    <motion.div
      className={`w-full p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${className || ""}`}
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
              className={`text-xs ${isOverdue() ? "text-[var(--hvsna-danger-color)]" : "text-gray-500"} mt-1 line-clamp-2`}
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
