import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import { Task, type TaskCreateInput } from "@/domain/task";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSnackbar } from "../components/snackbar-provider";
import { useSettings } from "../settings";
import { parseHijriDateString, useTaskEpoch } from "./task-form-helpers";
import logger from "../logger";
import type {
  RepeatConfig,
  TaskFormData,
  TaskScheduleAt,
} from "./task-form-types";
export type {
  TaskScheduleAt,
  RepeatConfig,
  TaskFormData,
} from "./task-form-types";

export interface UseTaskFormReturn {
  error: string | null;
  isSubmitting: boolean;
  handleSubmit: (f: FormData) => void;
  formData: TaskFormData;
  updateFormData: (updates: Partial<TaskFormData>) => void;
  updateScheduleAt: (updates: Partial<TaskScheduleAt>) => void;
  updateRepeatConfig: (updates: Partial<RepeatConfig>) => void;
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void
): UseTaskFormReturn => {
  const { createTask } = useTaskContext();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const { createRecurringTask } = useRecurringTasks();

  const { latitude, longitude, createHijriDate, toHijriDate } = useHijriDate();
  const getTaskEpoch = useTaskEpoch();

  const monthOffsets = settings.hijriMonthOffsets ?? {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    scheduleAt: {
      date: null,
      time: "",
    },
    repeat: {
      recurringType: "none",
      interval: 1,
      end: "never",
      endDate: null,
      endOccurrences: 1,
      useGregorian: false,
    },
    tags: [],
  });

  const updateFormData = (updates: Partial<TaskFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateScheduleAt = (updates: Partial<TaskScheduleAt>) => {
    setFormData((prev) => ({
      ...prev,
      scheduleAt: { ...prev.scheduleAt, ...updates },
    }));
  };

  const updateRepeatConfig = (updates: Partial<RepeatConfig>) => {
    setFormData((prev) => ({
      ...prev,
      repeat: { ...prev.repeat, ...updates },
    }));
  };

  const handleSubmit = async (submittedFormData: FormData) => {
    const taskData = Object.fromEntries(submittedFormData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    taskData.atTime = formData.scheduleAt.time;
    if (!!formData.scheduleAt.date) {
      taskData.atEpochMillis = getTaskEpoch(
        formData.scheduleAt.date,
        formData.scheduleAt.time
      ) as number;
    }

    // Calculate the offset for the task's scheduled month
    let hijriDateOffset = 0;
    if (formData.scheduleAt.date) {
      const hijriDate = toHijriDate(formData.scheduleAt.date);
      hijriDateOffset = monthOffsets?.[hijriDate.month] ?? 0;
    }

    try {
      setIsSubmitting(true);

      const isRecurring = formData.repeat.recurringType !== "none";

      if (isRecurring && formData.scheduleAt.date) {
        const baseDateEpoch = getTaskEpoch(
          formData.scheduleAt.date,
          formData.scheduleAt.time
        ) as number;
        const repeatEndEpoch =
          formData.repeat.end === "on_date" && formData.repeat.endDate
            ? (() => {
                const {
                  year: ey,
                  month: em,
                  day: ed,
                } = parseHijriDateString(formData.repeat.endDate as string);
                return createHijriDate(ey, em, ed).endOfDayEpoch();
              })()
            : undefined;
        const template = await createRecurringTask({
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          baseDateEpoch,
          recurringType: formData.repeat.recurringType,
          recurringInterval: formData.repeat.interval,
          atTime: formData.scheduleAt.time,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset,
          tags: formData.tags,
          recurringEnd: formData.repeat.end,
          recurringEndEpoch: repeatEndEpoch,
          recurringEndOccurrences: formData.repeat.endOccurrences,
          useGregorian: formData.repeat.useGregorian,
        });

        if (onSuccess) {
          onSuccess(new Task({ name: template.name }));
        }
      } else {
        const taskInput: TaskCreateInput = {
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          atEpochMillis: taskData.atEpochMillis ?? null,
          atTime: taskData.atTime,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset,
          tags: formData.tags.length > 0 ? formData.tags : [],
        };

        const result = await createTask(taskInput);

        if (onSuccess) {
          onSuccess(result);
        }

        if (
          !isMatchLocationContext(
            location,
            formData.scheduleAt.date as Date,
            new Date()
          )
        ) {
          showSnackbar("Task created but not listed in this page");
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

  return {
    error: null,
    isSubmitting,
    handleSubmit,
    formData,
    updateFormData,
    updateScheduleAt,
    updateRepeatConfig,
  };
};

function isMatchLocationContext(
  location: any,
  selectedDate: Date,
  today: Date
) {
  if (location?.state?.context === "all") {
    return true;
  }

  if (!selectedDate) {
    return ["today", "upcoming"].indexOf(location.state?.context) == -1;
  }

  const todayTimestamp = today.valueOf();
  const selectedTimestamp = selectedDate.valueOf();

  if (selectedTimestamp <= todayTimestamp) {
    return ["today", "upcoming"].indexOf(location.state?.context) !== -1;
  }

  return location.state?.context === "upcoming";
}
