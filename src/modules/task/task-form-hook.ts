import { useEffect, useState } from "react";
import { useLocation } from "react-router";
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
import { useSnackbar } from "../../ui/snackbar-provider";
import { useSettings } from "src/modules/settings/useSettings";
import {
  parseHijriDateString,
  parseTimeString,
  formatHijriDateString,
} from "./task-form-helpers";

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
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
): UseTaskFormReturn => {
  const closeTaskForm = useTaskStore((s) => s.closeTaskForm);
  const createTask = useTaskStore((s) => s.createTask);
  const error = useTaskStore((s) => s.error);
  const getTask = useTaskStore((s) => s.getTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const refreshAllTaskLists = useTaskStore((s) => s.refreshAllTaskLists);
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();
  const { getToday, createHijriDate } = useHijriCalendar();

  // Use the useGoal hook when we have a goalId
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");

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

      // Use HijriDate.hijriToJsDate to convert Hijri date to JavaScript Date with time
      const jsDate = HijriDate.hijriToJsDate(
        year,
        month,
        day,
        hour,
        minute,
        undefined,
        undefined,
        { offset },
      );
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
      taskData.atDateHijri = formatHijriDateString(
        selectedHijriDate.year,
        selectedHijriDate.month,
        selectedHijriDate.day,
      );
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
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      let result = await createTask(taskInput, () => {
        refreshAllTaskLists(getToday());
      });

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

      if (!isMatchLocationContext(location, selectedHijriDate, getToday())) {
        showSnackbar("Task created but not listed in this page");
      }
    } catch (err) {
      console.error(err);
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
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
  };
};

function isMatchLocationContext(
  location: any,
  selectedHijriDate: any,
  today: HijriDate,
) {
  if (location.state.context === "all") {
    return true;
  }

  if (!selectedHijriDate) {
    return ["today", "upcoming"].indexOf(location.state?.context) == -1;
  }

  const todayTimestamp = today.toDate().valueOf();
  const selectedTimestamp = selectedHijriDate.toDate().valueOf();

  if (selectedTimestamp <= todayTimestamp) {
    return ["today", "upcoming"].indexOf(location.state?.context) !== -1;
  }

  return location.state?.context === "upcoming";
}
