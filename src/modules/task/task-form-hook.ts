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

  function calculateDueTime(h: HijriDate) {}

  const {
    latitude,
    longitude,
    manualOffset: offset,
    getToday,
  } = useHijriDate();
  const getTaskEpoch = useTaskEpoch();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    scheduleAt: {
      dateHijri: null,
      time: "",
    },
    repeat: {
      repeat: "none",
      interval: 1,
      end: "never",
      endDate: null,
      endOccurrences: 1,
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
    if (!!formData.scheduleAt.dateHijri) {
      const { year, month, day } = formData.scheduleAt.dateHijri;
      taskData.atEpochMillis = getTaskEpoch(
        year,
        month,
        day,
        formData.scheduleAt.time
      ) as number;
    }

    try {
      setIsSubmitting(true);

      const isRecurring = formData.repeat.repeat !== "none";

      if (isRecurring && formData.scheduleAt.dateHijri) {
        const hijriOpts = { latitude, longitude, offset: offset ?? 0 };
        const { year, month, day } = formData.scheduleAt.dateHijri;
        const baseDateEpoch = getTaskEpoch(
          year,
          month,
          day,
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
                return new HijriDate(
                  ey,
                  em,
                  ed,
                  undefined,
                  undefined,
                  0,
                  0,
                  hijriOpts
                )
                  .endOfDay()
                  .toDate()
                  .valueOf();
              })()
            : undefined;
        const template = await createRecurringTask({
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          baseDateEpoch,
          repeat: formData.repeat.repeat,
          repeatInterval: formData.repeat.interval,
          atTime: formData.scheduleAt.time,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset: offset,
          tags: formData.tags,
          repeatEnd: formData.repeat.end,
          repeatEndEpoch,
          repeatEndOccurrences: formData.repeat.endOccurrences,
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
          hijriDateOffset: offset,
          tags: formData.tags.length > 0 ? formData.tags : [],
        };

        const result = await createTask(taskInput);

        if (onSuccess) {
          onSuccess(result);
        }

        if (
          !isMatchLocationContext(
            location,
            formData.scheduleAt.dateHijri,
            getToday()
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
  selectedHijriDate: any,
  today: HijriDate
) {
  if (location?.state?.context === "all") {
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
