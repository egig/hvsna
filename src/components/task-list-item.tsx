import React from "react";
import { CheckCircleIcon, CircleIcon } from "lucide-react";
import type { Task, TaskStatus } from "src/lib/types/task";
import { ListItem } from "src/components/list-item";
import { useGoal } from "../modules/goal/use-goal";

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

  const formatScheduledDate = (hijriDate?: string) => {
    if (!hijriDate) return "No date set";
    return hijriDate;
  };

  const getTargetInfo = (goal: any) => {
    if (!task.targetId || !showGoalInfo) return null;
    const targetName = goal?.name || "Unknown Goal";
    return `Goal: ${targetName}${task.targetValue ? ` (Value: ${task.targetValue})` : ""}`;
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const nextStatus = getNextStatus(task.status);
      onStatusChange(task, nextStatus);
    }
  };

  const handleItemClick = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  return (
    <ListItem
      key={task.id}
      title={task.name}
      subtitle={`Scheduled: ${formatScheduledDate(task.hijriDate)}`}
      description={getTargetInfo(goal) || undefined}
      leftIcon={
        onStatusChange ? (
          <button
            onClick={handleStatusClick}
            className="flex-shrink-0 mt-1 transition-transform hover:scale-110"
            aria-label={`Change status from ${task.status}`}
          >
            {getStatusIcon(task.status)}
          </button>
        ) : (
          <div className="flex-shrink-0 mt-1">
            {getStatusIcon(task.status)}
          </div>
        )
      }
      onClick={handleItemClick}
      rightIcon={
        <span
          className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(
            task.status
          )} bg-opacity-10`}
        >
          {task.status.replace("_", " ")}
        </span>
      }
      className={className}
    />
  );
}

export default TaskListItem;
