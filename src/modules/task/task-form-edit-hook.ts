import { useEffect, useState } from "react";
import { useTaskStore } from "./task-store";
import { useLog } from "../log/use-log";
import { useGoal, type Goal } from "../goal/use-goal";
import { HijriDate, useHijriCalendar } from "src/modules/calendar/hijri";
import { useGoals } from "../goal/use-goals";
import type { Tracker } from "../tracker/trackerStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useTracker } from "../tracker/use-tracker";
import type { Task, TaskUpdateInput } from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSettings } from "src/modules/settings/useSettings";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  selectedHijriDate: HijriDate | null;
  selectedTime: string | null;
  isSubmitting: boolean;
  setSelectedHijriDate: any;
  setSelectedTime: any;
  selectedTargetId: string;
  setSelectedTargetId: any;
  selectedGoal: any;
  trackerAttributes: any;
  // Prayer time fields
  selectedPrayerTime?: string;
  setSelectedPrayerTime?: any;
  handleTimeSelection: (time: string, prayerTime?: string) => void;
  handleSubmit: (f: FormData) => void;
  handleDelete: () => void;
}

export const useTaskFormEdit = (
  taskId: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
  onDelete?: (taskId: string) => void,
): UseTaskFormReturn => {
  const closeTaskForm = useTaskStore((s) => s.closeTaskForm);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const error = useTaskStore((s) => s.error);
  const getTask = useTaskStore((s) => s.getTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const refreshAllTaskLists = useTaskStore((s) => s.refreshAllTaskLists);

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [selectedHijriDate, setSelectedHijriDate] = useState<HijriDate | null>(
    null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  // Prayer time state
  const [selectedPrayerTime, setSelectedPrayerTime] = useState<string>("");

  const { goals } = useGoals();
  const { createRecurringTask } = useRecurringTasks();
  const { settings } = useSettings();
  const offset = settings.manualDateOffset || 0;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();

  // Use the useGoal hook when we have a goalId
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");
  const { getToday, createHijriDate } = useHijriCalendar();

  useEffect(() => {
    if (task?.atDateHijri) {
      // Parse YYYYMMDD format using helper function
      const { year, month, day } = parseHijriDateString(task.atDateHijri);

      // Parse time if available using helper function
      let hour = 0;
      let minute = 0;
      if (task?.atTime) {
        const timeParts = parseTimeString(task.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      setSelectedHijriDate(createHijriDate(year, month, day, hour, minute));
    }

    // Initialize time and prayer time state from existing task
    if (task?.atTime && !task.usePrayerTime) {
      // Task has custom time
      setSelectedTime(task.atTime);
      setSelectedPrayerTime(""); // Clear prayer time for custom time
    } else if (task?.prayerTime && task.usePrayerTime) {
      // Task has prayer time
      setSelectedPrayerTime(task.prayerTime);
      setSelectedTime(null); // Clear custom time for prayer time
    } else {
      // Task has no time or prayer time
      setSelectedTime(null);
      setSelectedPrayerTime("");
    }
  }, [task, offset]);

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
    const updatedTask = await updateTask(id, input, () => {
      refreshAllTaskLists(getToday());
    });

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

  const handleTimeSelection = (time: string, prayerTime?: string) => {
    setSelectedTime(time);
    setSelectedPrayerTime(prayerTime || "");
  };

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    if (!!selectedHijriDate) {
      const year = selectedHijriDate.year.toString().padStart(4, "0");
      const month = selectedHijriDate.month.toString().padStart(2, "0");
      const day = selectedHijriDate.day.toString().padStart(2, "0");
      taskData.atDateHijri = `${year}${month}${day}`;
      taskData.atEpochMillis = selectedHijriDate?.toDate().valueOf();

      if (!!selectedTime) {
        taskData.atTime = selectedTime;
      }
    } else {
      taskData.atDateHijri = undefined;
      taskData.atEpochMillis = undefined;
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
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
        atDateHijri: taskData.atDateHijri,
        atTime: taskData.atTime,
        // Prayer time fields
        usePrayerTime: !!selectedPrayerTime,
        prayerTime: selectedPrayerTime || undefined,
        // Add location coordinates for prayer time calculation
        lat: -6.2088, // Default Jakarta coordinates
        long: 106.8456,
        timezone: "Asia/Jakarta",
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      let result = await updateTask(taskId, taskInput, () =>
        refreshAllTaskLists(getToday()),
      );

      // Create recurring task if repeat is selected and not "none"
      if (taskData.repeat && taskData.repeat !== "none" && taskInput.atTime) {
        try {
          await createRecurringTask({
            name: taskInput.name,
            targetId: taskInput.targetId,
            targetValue: taskInput.targetValue,
            attributes: taskInput.attributes,
            repeat: taskData.repeat,
            baseDate: taskInput.atEpochMillis,
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

  const handleDelete = async () => {
    if (taskId && task) {
      if (
        confirm(
          `Are you sure you want to delete this task "${task.name}"? This action cannot be undone.`,
        )
      ) {
        deleteTask(taskId, () => {
          refreshAllTaskLists(getToday());
        }).then(() => {
          setTask(null);
          closeTaskForm();
          onDelete?.(taskId);
        });
      }
    }
  };

  return {
    task,
    error,
    selectedHijriDate: selectedHijriDate || null,
    isSubmitting,
    setSelectedHijriDate,
    selectedTime,
    setSelectedTime,
    selectedTargetId,
    setSelectedTargetId,
    selectedGoal,
    trackerAttributes,
    // Prayer time fields
    selectedPrayerTime,
    setSelectedPrayerTime,
    handleTimeSelection,
    handleSubmit,
    handleDelete,
  };
};
