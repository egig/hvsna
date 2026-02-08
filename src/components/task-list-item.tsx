import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CircleIcon, CheckCircleIcon } from "lucide-react";
import type { Task, TaskStatus } from "../lib/types/task";
import { useGoal } from "../modules/goal/use-goal";
import { HijriDate } from "src/lib/hijri";
import { useTaskListItem } from "src/modules/task/task-list-item-hook";
import { IoEllipseOutline } from "react-icons/io5";
import toast from "react-hot-toast";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
  showDateTime?: boolean;
}

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  showGoalInfo = true,
  className,
  showDateTime = false,
}: TaskListItemProps) {
  const { goal } = useGoal(task.targetId || undefined);

  const { updateStatus } = useTaskListItem();

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    switch (currentStatus) {
      case "pending":
        return "in_progress";
      case "in_progress":
        return "completed";
      case "completed":
        return "pending";
      default:
        return "pending";
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon size={24} className="text-green-500" />;
      case "in_progress":
        return <CircleIcon size={24} className="text-blue-500" />;
      default:
        return <IoEllipseOutline size={24} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const formatScheduledDate = (task: Task) => {
    if (!task.hijriDate) return null;

    const today = HijriDate.fromDate(new Date());
    const tomorrow = today.next();
    const todayString = `${today.year.toString().padStart(4, "0")}${today.month.toString().padStart(2, "0")}${today.day.toString().padStart(2, "0")}`;
    const tomorrowString = `${tomorrow.year.toString().padStart(4, "0")}${tomorrow.month.toString().padStart(2, "0")}${tomorrow.day.toString().padStart(2, "0")}`;

    // Check if today
    if (task.hijriDate === todayString) {
      return "Today";
    }

    // Check if tomorrow
    if (task.hijriDate === tomorrowString) {
      return "Tomorrow";
    }

    // Check if within next 7 days
    try {
      const taskDate = new HijriDate(
        parseInt(task.hijriDate.slice(0, 4)),
        parseInt(task.hijriDate.slice(4, 6)),
        parseInt(task.hijriDate.slice(6, 8)),
      );
      const todayGregorian = today.toDate();
      const taskGregorian = taskDate.toDate();
      const daysDiff = Math.floor(
        (taskGregorian.getTime() - todayGregorian.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // If within next 7 days (2-7 days from now)
      if (daysDiff > 1 && daysDiff <= 7) {
        return taskDate.format("dddd"); // Day name
      }

      // Otherwise show formatted date
      return taskDate.format("D MMMM");
    } catch {
      return task.hijriDate;
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

    toast.promise(
      updateStatus(task.id, nextStatus).then(() => {
        if (onStatusChange) {
          onStatusChange(task, nextStatus);
        }
      }),
      {
        loading: "Updating status...",
        success: `Status changed to ${nextStatus.replace("_", " ")}`,
        error: "Failed to update status",
      },
    );
  };

  const handleItemClick = () => {
    if (onEdit) {
      onEdit(task);
    }
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
            {getStatusIcon(task?.status || "pending")}
          </button>
        </div>

        {/* Task Name and Description */}
        <div className="flex-1 min-w-0">
          {/* Task Name */}
          <h3
            className={`text-gray-900 truncate ${getStatusColor(task.status)}`}
          >
            {task.name}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Description */}
          {showDateTime && !!task.hijriDate && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {formatScheduledDate(task)}
            </p>
          )}

          {/* Description (Goal Info) */}
          {getTargetInfo(goal) && (
            <p className="text-sm text-gray-500 mt-1 truncate">
              {getTargetInfo(goal)}
            </p>
          )}

          {/* Scheduled Date Display this in non-time context */}
          {/* {formatScheduledDate(task) && (
            <p className="text-xs text-gray-400 mt-1">
              {formatScheduledDate(task)}
            </p>
          )} */}
        </div>
      </div>
    </motion.div>
  );
}

export default TaskListItem;
