import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useTaskContext } from "./task-context";
import { useLog } from "../log/use-log";
import { useGoal, type Goal } from "../goal/use-goal";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import { useGoals } from "../goal/use-goals";
import type { Tracker } from "../tracker/trackerStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useTracker } from "../tracker/use-tracker";
import type {
  PrayerTime,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSnackbar } from "../../ui/snackbar-provider";
import { useSettings } from "../settings/useSettings";
import { formatHijriDateString } from "./task-form-helpers";
import logger from "src/lib/logger";

export interface TaskScheduleAt {
  dateHijri: HijriDate | null;
  time: string;
  prayerTime: string;
}

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  isSubmitting: boolean;
  selectedTargetId: string;
  setSelectedTargetId: any;
  selectedGoal: any;
  trackerAttributes: any;
  handleSubmit: (f: FormData) => void;
  selectedScheduleAt: TaskScheduleAt;
  setSelectedScheduleAt: any;
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
): UseTaskFormReturn => {
  const { createTask } = useTaskContext();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();

  // TODO use useHijriDate instead
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });

  const { goals } = useGoals();
  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();
  const { getToday } = useHijriDate();
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    if (!!selectedScheduleAt.dateHijri) {
      taskData.atDateHijri = formatHijriDateString(
        selectedScheduleAt.dateHijri.year,
        selectedScheduleAt.dateHijri.month,
        selectedScheduleAt.dateHijri.day,
      );

      if (!!selectedScheduleAt.time) {
        taskData.atTime = selectedScheduleAt.time;
      }
      if (!!selectedScheduleAt.prayerTime) {
        taskData.prayerTime = selectedScheduleAt.prayerTime as PrayerTime;
      }
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

      const taskInput: TaskCreateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
        atDateHijri: taskData.atDateHijri as string,
        atTime: taskData.atTime,
        prayerTime: taskData.prayerTime as PrayerTime,
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
        hijriDateOffset: offset,
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      // Use TaskProvider's createTask directly
      const result = await createTask(taskInput);
      setTask(null);

      if (onSuccess) {
        onSuccess(result);
      }

      if (
        !isMatchLocationContext(
          location,
          selectedScheduleAt.dateHijri,
          getToday(),
        )
      ) {
        showSnackbar("Task created but not listed in this page");
      }

      // Create recurring task if repeat is selected and not "none"
      if (taskData.repeat && taskData.repeat !== "none" && taskInput.atTime) {
        try {
          // TODO
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
        onError(err instanceof Error ? err.message : "Failed to create task");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    selectedScheduleAt,
    setSelectedScheduleAt,
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

  const todayTimestamp = today.startOfDay().toDate().valueOf();
  const selectedTimestamp = selectedHijriDate.startOfDay().toDate().valueOf();

  if (selectedTimestamp <= todayTimestamp) {
    return ["today", "upcoming"].indexOf(location.state?.context) !== -1;
  }

  return location.state?.context === "upcoming";
}
