import { useEffect, useState } from "react";
import { formatHijriDateString } from "./task-form-helpers";
import { useTaskContext } from "./task-context";
import { useLog } from "../log/use-log";
import { useGoal, type Goal } from "../goal/use-goal";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import { useGoals } from "../goal/use-goals";
import type { Tracker } from "../tracker/trackerStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useTracker } from "../tracker/use-tracker";
import type { PrayerTime, Task, TaskUpdateInput } from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSettings } from "../settings/useSettings";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";
import type { TaskScheduleAt } from "./task-form-hook";
import logger from "src/lib/logger";

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  isSubmitting: boolean;
  selectedTargetId: string;
  setSelectedTargetId: any;
  selectedGoal: any;
  trackerAttributes: any;
  handleSubmit: (f: FormData) => void;
  handleDelete: () => void;
  removeTime: boolean;
  setRemoveTime: (removeTime: boolean) => void;
  selectedScheduleAt: TaskScheduleAt;
  setSelectedScheduleAt: any;
}

export const useTaskFormEdit = (
  taskId: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
  onDelete?: (taskId: string) => void,
): UseTaskFormReturn => {
  // Use TaskProvider's updateTask and deleteTask mutations
  const { updateTask, deleteTask, getTask } = useTaskContext();

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  const { goals } = useGoals();
  const { createRecurringTask } = useRecurringTasks();
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();

  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");
  const { getToday, createHijriDate } = useHijriDate();
  const [removeTime, setRemoveTime] = useState(false);

  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });

  // TODO use useHijriDate instead
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    if (!!selectedScheduleAt?.dateHijri) {
      taskData.atDateHijri = formatHijriDateString(
        selectedScheduleAt.dateHijri.year,
        selectedScheduleAt.dateHijri.month,
        selectedScheduleAt.dateHijri.day,
      );

      if (!!selectedScheduleAt.time) {
        taskData.atTime = selectedScheduleAt.time;
      }
    } else {
      taskData.atDateHijri = undefined;
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

      const taskInput: TaskUpdateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
        atDateHijri: taskData.atDateHijri,
        atTime: taskData.atTime,
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
        hijriDateOffset: offset,
        prayerTime: selectedScheduleAt?.prayerTime as PrayerTime,
        removeTime: removeTime,
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      // Use TaskProvider's updateTask directly
      const result = await updateTask(taskId, taskInput);
      setTask(null);

      if (onSuccess) {
        onSuccess(result);
      }

      // Create recurring task if repeat is selected and not "none"
      if (taskData.repeat && taskData.repeat !== "none" && taskInput.atTime) {
        try {
          // TODO: implement recurring task creation
          // await createRecurringTask({
          //   name: taskInput.name,
          //   targetId: taskInput.targetId,
          //   targetValue: taskInput.targetValue,
          //   attributes: taskInput.attributes,
          //   repeat: taskData.repeat,
          //   baseDate: taskInput.atEpochMillis,
          // });
        } catch (recurringError) {
          logger.error("Failed to create recurring task:", recurringError);
          // Don't fail the main task creation if recurring task creation fails
        }
      }
    } catch (err) {
      logger.error(err);
      if (onError) {
        onError(err instanceof Error ? err.message : "Failed to update task");
      }
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
        try {
          await deleteTask(taskId);
          setTask(null);
          onDelete?.(taskId);
        } catch (error) {
          logger.error(error);
          if (onError) {
            onError(
              error instanceof Error ? error.message : "Failed to delete task",
            );
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!!task?.atDateHijri) {
      // Parse YYYYMMDD format using helper function
      const { year, month, day } = parseHijriDateString(task.atDateHijri);

      // Parse time if available using helper function
      let hour: number | undefined = undefined;
      let minute: number | undefined = undefined;
      if (!!task.atTime) {
        const timeParts = parseTimeString(task.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      const hijriDate = createHijriDate(year, month, day, hour, minute);
      setSelectedScheduleAt({
        dateHijri: hijriDate,
        time: task?.atTime || "",
        prayerTime: task?.prayerTime || "",
      });
    } else {
      setSelectedScheduleAt({
        dateHijri: null,
        time: "",
        prayerTime: "",
      });
    }
  }, [task, createHijriDate]);

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
  }, [taskId, getTask, currentTargetId]);

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

  return {
    task,
    error: null,
    isSubmitting,
    selectedTargetId,
    setSelectedTargetId,
    selectedGoal,
    trackerAttributes,
    handleSubmit,
    handleDelete,
    removeTime,
    setRemoveTime,
    selectedScheduleAt,
    setSelectedScheduleAt,
  };
};
