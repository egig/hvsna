import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
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
import { useLists } from "./use-lists";
import logger from "../../lib/logger";

export interface TaskScheduleAt {
  dateHijri: HijriDate | null;
  time: string;
  prayerTime: string;
}

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  isSubmitting: boolean;
  handleSubmit: (f: FormData) => void;
  selectedScheduleAt: TaskScheduleAt;
  setSelectedScheduleAt: any;
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  lists: any[];
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
): UseTaskFormReturn => {
  const { createTask, preselectedListId } = useTaskContext();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const { lists } = useLists();

  // TODO use useHijriDate instead
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

  const [task, setTask] = useState<Task | null>(null);
  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });
  const [selectedListId, setSelectedListId] = useState<string>(
    preselectedListId || "",
  );

  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToday } = useHijriDate();

  // Update selectedListId when preselectedListId changes
  useEffect(() => {
    if (preselectedListId && !selectedListId) {
      setSelectedListId(preselectedListId);
    }
  }, [preselectedListId, selectedListId]);

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
        listId: selectedListId || undefined,
      };

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
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

  return {
    task,
    error: null,
    isSubmitting,
    handleSubmit,
    selectedScheduleAt,
    setSelectedScheduleAt,
    selectedListId,
    setSelectedListId,
    lists,
  };
};

function isMatchLocationContext(
  location: any,
  selectedHijriDate: any,
  today: HijriDate,
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
