import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { taskRepository } from "./task-repository";

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
  const { closeTaskForm, getTask } = useTaskContext();
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

  // React Query mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: (taskInput: TaskCreateInput) => taskRepository.create(taskInput),
    onSuccess: (result) => {
      setTask(null);
      closeTaskForm();
      
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
    },
    onError: (error) => {
      console.error(error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to create task');
      }
    },
  });

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
    const updatedTask = await taskRepository.update(id, input);

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

      // Use React Query mutation
      await createTaskMutation.mutateAsync(taskInput);

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
          console.error("Failed to create recurring task:", recurringError);
          // Don't fail the main task creation if recurring task creation fails
        }
      }
    } catch (err) {
      console.error(err);
      // Error is handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    task,
    error: null, // Error is handled by the mutation
    isSubmitting: isSubmitting || createTaskMutation.isPending,
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

  const todayTimestamp = today.toDate().valueOf();
  const selectedTimestamp = selectedHijriDate.toDate().valueOf();

  if (selectedTimestamp <= todayTimestamp) {
    return ["today", "upcoming"].indexOf(location.state?.context) !== -1;
  }

  return location.state?.context === "upcoming";
}
