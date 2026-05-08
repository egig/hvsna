import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import { Task, type PrayerTime, type TaskCreateInput } from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSnackbar } from "../components/snackbar-provider";
import { useSettings } from "../settings/useSettings";
import { formatHijriDateString } from "./task-form-helpers";
import { useProjects } from "./use-projects";
import { usePouchDB } from "../../pouchdb";
import logger from "../logger";
import { useTrackers } from "../tracker/useTrackers";
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
  projectIdPreselected: boolean;
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void
): UseTaskFormReturn => {
  const { createTask, generateOccurrencesForTemplate } = useTaskContext();
  const location = useLocation();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const { projects } = useProjects();
  const { createRecurringTask } = useRecurringTasks();
  const { createTracker } = useTrackers();

  // Use useHijriDate hook instead of manual settings extraction
  const {
    timezone,
    latitude,
    longitude,
    manualOffset: offset,
    getToday,
  } = useHijriDate();

  // Consolidated state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    scheduleAt: {
      dateHijri: null,
      time: "",
      prayerTime: "",
    },
    projectId: params.projectId || "",
    repeat: {
      repeat: "none",
      interval: 1,
      end: "never",
      endDate: null,
      endOccurrences: 1,
    },
    tags: [],
    showGoalSettings: false,
    inputMode: undefined,
    unit: undefined,
  });

  // Helper functions for updating state
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

  // Reset tracker settings when repeat is deselected
  useEffect(() => {
    if (formData.repeat.repeat === "none") {
      updateFormData({
        trackerId: undefined,
        showGoalSettings: false,
        inputMode: undefined,
        unit: undefined,
        goalTarget: undefined,
        goalPeriod: undefined,
      });
    }
  }, [formData.repeat.repeat]);

  const handleSubmit = async (submittedFormData: FormData) => {
    const taskData = Object.fromEntries(submittedFormData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    if (!!formData.scheduleAt.dateHijri) {
      taskData.atDateHijri = formatHijriDateString(
        formData.scheduleAt.dateHijri.year,
        formData.scheduleAt.dateHijri.month,
        formData.scheduleAt.dateHijri.day
      );

      if (!!formData.scheduleAt.time) {
        taskData.atTime = formData.scheduleAt.time;
      }
      if (!!formData.scheduleAt.prayerTime) {
        taskData.prayerTime = formData.scheduleAt.prayerTime as PrayerTime;
      }
    }

    try {
      setIsSubmitting(true);

      const attr: Record<string, any> = {};
      const isRecurring = formData.repeat.repeat !== "none";
      const isTracker = !!formData.inputMode;

      let trackerId: string | undefined;

      if (isTracker) {
        // Create a Tracker entity
        const goals =
          formData.showGoalSettings && formData.goalTarget
            ? [
                {
                  id: crypto.randomUUID(),
                  name: "Goal",
                  condition: "target",
                  target: formData.goalTarget,
                  period: formData.goalPeriod,
                },
              ]
            : undefined;

        const tracker = await createTracker({
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          inputMode: formData.inputMode!,
          unit: formData.unit,
          goals,
        });

        trackerId = tracker.id;
      }

      if (isRecurring && taskData.atDateHijri) {
        // Create a RecurringTask template, then generate all instances
        const template = await createRecurringTask({
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          attributes: attr,
          baseDateHijri: taskData.atDateHijri as string,
          repeat: formData.repeat.repeat,
          repeatInterval: formData.repeat.interval,
          atTime: formData.scheduleAt.time,
          prayerTime: formData.scheduleAt.prayerTime as PrayerTime,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset: offset,
          projectId: formData.projectId,
          tags: formData.tags,
          repeatEnd: formData.repeat.end,
          repeatEndDate: formData.repeat.endDate as string,
          repeatEndOccurrences: formData.repeat.endOccurrences,
          trackerId,
        });

        await generateOccurrencesForTemplate(template);

        if (onSuccess) {
          onSuccess(new Task({ name: template.name }));
        }
      } else {
        const taskInput: TaskCreateInput = {
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          attributes: attr,
          atDateHijri: taskData.atDateHijri as string,
          atTime: taskData.atTime,
          prayerTime: taskData.prayerTime as PrayerTime,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset: offset,
          projectId: formData.projectId || null,
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
    projects,
    projectIdPreselected: !!params.projectId,
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
