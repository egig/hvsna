import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon, CircleIcon } from "lucide-react";
import type { Task, TaskStatus } from "src/lib/types/task";
import { useGoal } from "../modules/goal/use-goal";
import { HijriDate } from "src/lib/hijri";
import { useTaskListItem } from "src/modules/task/task-list-item-hook";

interface TaskListItemProps {
  task: Task;
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  showGoalInfo?: boolean;
  className?: string;
}

export function TaskListItem({
  task,
  onStatusChange,
  onEdit,
  showGoalInfo = true,
  className,
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
        return <CircleIcon size={24} className="text-gray-400" />;
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
    if (task.hijriDate) {
      const date = new HijriDate(
        parseInt(task.hijriDate.slice(0, 4)),
        parseInt(task.hijriDate.slice(4, 6)),
        parseInt(task.hijriDate.slice(6, 8)),
      );
      return date.format("DD MMMM");
    }
    return null;
  };

  const getTargetInfo = (goal: any) => {
    if (!task.targetId || !showGoalInfo) return null;
    const targetName = goal?.name || "Unknown Goal";
    return `Goal: ${targetName}${task.targetValue ? ` (Value: ${task.targetValue})` : ""}`;
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = getNextStatus(task.status);
    updateStatus(task.id, nextStatus).then(() => {
      if (onStatusChange) {
        onStatusChange(task, nextStatus);
      }
    });
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
      layout
    >
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleStatusClick}
          className="m-0 p-0 h-auto w-auto flex-shrink-0 mt-0.5 transition-transform hover:scale-110 cursor-pointer"
          aria-label={`Change status from ${task.status}`}
        >
          {getStatusIcon(task?.status || "pending")}
        </button>

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
