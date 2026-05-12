import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import { Task, type PrayerTime, type TaskCreateInput } from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSnackbar } from "../components/snackbar-provider";
import { useSettings } from "../settings/useSettings";
import { parseHijriDateString } from "./task-form-helpers";
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
  projects: any[];
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void
): UseTaskFormReturn => {
  const { createTask } = useTaskContext();
  const location = useLocation();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const { createRecurringTask } = useRecurringTasks();

  const {
    latitude,
    longitude,
    manualOffset: offset,
    getToday,
  } = useHijriDate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    scheduleAt: {
      dateHijri: null,
      time: "",
      prayerTime: "",
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

    if (formData.scheduleAt.dateHijri) {
      const { year, month, day } = formData.scheduleAt.dateHijri;
      const hijriOpts = { latitude, longitude, offset: offset ?? 0 };
      if (formData.scheduleAt.time) {
        taskData.atTime = formData.scheduleAt.time;
        const [h, m] = formData.scheduleAt.time.split(":").map(Number);
        taskData.atEpochMillis = new HijriDate(
          year,
          month,
          day,
          h,
          m,
          0,
          0,
          hijriOpts
        )
          .toDate()
          .valueOf();
      } else {
        taskData.atEpochMillis = new HijriDate(
          year,
          month,
          day,
          undefined,
          undefined,
          0,
          0,
          hijriOpts
        )
          .endOfDay()
          .toDate()
          .valueOf();
      }
      if (formData.scheduleAt.prayerTime) {
        taskData.prayerTime = formData.scheduleAt.prayerTime as PrayerTime;
      }
    }

    try {
      setIsSubmitting(true);

      const attr: Record<string, any> = {};
      const isRecurring = formData.repeat.repeat !== "none";

      if (isRecurring && formData.scheduleAt.dateHijri) {
        const { year, month, day } = formData.scheduleAt.dateHijri;
        const hijriOpts = { latitude, longitude, offset: offset ?? 0 };
        const baseDateEpoch = new HijriDate(
          year,
          month,
          day,
          undefined,
          undefined,
          0,
          0,
          hijriOpts
        )
          .endOfDay()
          .toDate()
          .valueOf();
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
          attributes: attr,
          baseDateEpoch,
          repeat: formData.repeat.repeat,
          repeatInterval: formData.repeat.interval,
          atTime: formData.scheduleAt.time,
          prayerTime: formData.scheduleAt.prayerTime as PrayerTime,
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
          attributes: attr,
          atEpochMillis: taskData.atEpochMillis ?? null,
          atTime: taskData.atTime,
          prayerTime: taskData.prayerTime as PrayerTime,
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
