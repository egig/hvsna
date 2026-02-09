import { useEffect, useRef, useState } from "react";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "../../lib/types/task";
import { useTaskStore } from "./task-store";
import { useLog } from "../log/use-log";
import { useGoal, type Goal } from "../goal/use-goal";
import { HijriDate } from "src/lib/hijri";
import { useGoals } from "../goal/use-goals";
import { useRecurringTasks } from "src/hooks/useRecurringTasks";
import type { Tracker } from "../tracker/trackerStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useTracker } from "../tracker/use-tracker";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  selectedHijriDate: HijriDate | null;
  isSubmitting: boolean;
  setSelectedHijriDate: any;
  selectedTargetId: string;
  setSelectedTargetId: any;
  selectedGoal: any;
  trackerAttributes: any;
  handleSubmit: (f: FormData) => void;
  handleDelete: () => void;
}

export const useTaskForm = (
  taskId?: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
  onDelete?: (taskId: string) => void,
): UseTaskFormReturn => {
  const closeTaskForm = useTaskStore((s) => s.closeTaskForm);
  const createTask = useTaskStore((s) => s.createTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const editingTaskId = useTaskStore((s) => s.editingTaskId);
  const error = useTaskStore((s) => s.error);
  const formOpen = useTaskStore((s) => s.formOpen);
  const getTask = useTaskStore((s) => s.getTask);
  const openTaskForm = useTaskStore((s) => s.openTaskForm);
  const setEditingTaskId = useTaskStore((s) => s.setEditingTaskId);
  const updateTask = useTaskStore((s) => s.updateTask);

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [selectedHijriDate, setSelectedHijriDate] = useState<HijriDate | null>(
    null,
  );
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  const { goals } = useGoals();
  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();

  // Use the useGoal hook when we have a goalId
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");

  useEffect(() => {
    setEditingTaskId(taskId || null);
  }, [taskId]);

  useEffect(() => {
    if (task?.hijriDate) {
      // Parse YYYYMMDD format
      const year = parseInt(task.hijriDate.substring(0, 4));
      const month = parseInt(task.hijriDate.substring(4, 6));
      const day = parseInt(task.hijriDate.substring(6, 8));

      setSelectedHijriDate(new HijriDate(year, month, day, 0, 0));
    }
  }, [task]);

  useEffect(() => {
    if (taskId) {
      getTask(taskId).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask);
          // Update targetId if task has one
          if (fetchedTask.targetId !== currentTargetId) {
            setCurrentTargetId(fetchedTask.targetId || null);
          }
        }
      });
    }
  }, [taskId, currentTargetId]);

  useEffect(() => {
    setSelectedTargetId(task?.targetId || "");
  }, [task]);

  useEffect(() => {
    const goal = goals.find((g) => g.id === selectedTargetId);
    setSelectedGoal(goal || null);

    if (goal) {
      getTracker(goal?.trackerId as string).then((tr) => {
        setTracker(tr);
      });
    }
  }, [selectedTargetId, goals]);

  const updateTaskWithLog = async (
    id: string,
    input: TaskUpdateInput,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await getTask(id);

    // Update the task
    const updatedTask = await updateTask(id, input);

    if (!input.targetId) {
      return updatedTask;
    }

    // Create log if status changed
    if (
      input.status !== undefined &&
      currentTask &&
      input.status !== currentTask.status
    ) {
      try {
        const goal = await getGoal(updatedTask.targetId as string);
        await createLog({
          trackerId: goal.trackerId,
          timestamp: Date.now(),
          value: updatedTask.targetValue as number, // 1 for completed, 0 for re-opened
          taskId: updatedTask.id,
          attributes: {
            newStatus: input.status,
            targetValue: updatedTask.targetValue,
          },
        });
      } catch (logError) {
        // Log creation failure shouldn't break task update
        console.warn("Failed to create log for task status change:", logError);
      }
    }

    return updatedTask;
  };

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as Task;

    if (!!selectedHijriDate) {
      const year = selectedHijriDate.year.toString().padStart(4, "0");
      const month = selectedHijriDate.month.toString().padStart(2, "0");
      const day = selectedHijriDate.day.toString().padStart(2, "0");
      taskData.hijriDate = `${year}${month}${day}`;

      // taskData.hour = selectedHijriDate?.hour;
      // taskData.minute = selectedHijriDate?.minute;
      // @ts-ignore
      taskData.scheduledAtEpochMillis = selectedHijriDate?.toDate().valueOf();
    } else {
      taskData.hijriDate = undefined;
      taskData.scheduledAtEpochMillis = undefined;
    }

    try {
      setIsSubmitting(true);

      // Extract scope values from form data
      const attr: Record<string, any> = {};
      if (selectedGoal?.scope) {
        selectedGoal.scope.forEach((attributeId: string, index: number) => {
          const value = formData.get(attributeId) as string;
          attr[attributeId] = value;
        });
      }

      if (tracker?.type === "counter") {
        taskData.targetValue = 1;
      }

      if (tracker?.negative) {
        taskData.targetValue = -1 * (taskData.targetValue || 0);
      }

      const taskInput: any = {
        name: taskData.name.trim(),
        description: taskData.description?.trim() || undefined,
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
        hijriDate: taskData.hijriDate,
        scheduledAtEpochMillis: taskData.scheduledAtEpochMillis,
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, taskInput);
      } else {
        result = await createTask(taskInput);
      }

      // Create recurring task if repeat is selected and not "none"
      if (
        taskData.repeat &&
        taskData.repeat !== "none" &&
        taskInput.scheduledAtEpochMillis
      ) {
        try {
          await createRecurringTask({
            name: taskInput.name,
            targetId: taskInput.targetId,
            targetValue: taskInput.targetValue,
            attributes: taskInput.attributes,
            repeat: taskData.repeat,
            baseDate: taskInput.scheduledAtEpochMillis,
          });
        } catch (recurringError) {
          console.error("Failed to create recurring task:", recurringError);
          // Don't fail the main task creation if recurring task creation fails
        }
      }

      setTask(null);
      closeTaskForm();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error(err);
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    closeTaskForm();
    if (onCancel) {
      onCancel();
    }
  };

  const handleDelete = async () => {
    if (taskId && task) {
      if (
        confirm(
          `Are you sure you want to delete this task "${task.name}"? This action cannot be undone.`,
        )
      ) {
        deleteTask(taskId).then(() => {
          setTask(null);
          closeTaskForm();
          onDelete?.(taskId);
        });
      }
    }
  };

  const reset = () => {
    setTask(null);
    setLoading(false);
    setCurrentTargetId(null);
    setSelectedHijriDate(undefined);
    setSelectedTargetId("");
    setIsSubmitting(false);
    setSelectedGoal(null);
    setTracker(null);
  };

  return {
    task,
    error,
    selectedHijriDate: selectedHijriDate || null,
    isSubmitting,
    setSelectedHijriDate,
    selectedTargetId,
    setSelectedTargetId,
    selectedGoal,
    trackerAttributes,
    handleSubmit,
    handleDelete,
  };
};
