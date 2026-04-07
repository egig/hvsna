import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import {
  Task,
  type PrayerTime,
  type TaskCreateInput,
  type TaskRepeat,
} from "./types";
import { useRecurringTasks } from "./use-recurring-tasks";
import { useSnackbar } from "../components/snackbar-provider";
import { useSettings } from "../settings/useSettings";
import { formatHijriDateString } from "./task-form-helpers";
import { useLists } from "./use-lists";
import { usePouchDB } from "../../pouchdb";
import { generateOccurrencesForTemplate } from "./recurring-task-generator";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import logger from "../logger";

export interface TaskScheduleAt {
  dateHijri: HijriDate | null;
  time: string;
  prayerTime: string;
}

export interface UseTaskFormReturn {
  error: string | null;
  isSubmitting: boolean;
  handleSubmit: (f: FormData) => void;
  selectedScheduleAt: TaskScheduleAt;
  setSelectedScheduleAt: any;
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  selectedRepeat: TaskRepeat;
  setSelectedRepeat: (repeat: TaskRepeat) => void;
  selectedRepeatInterval: number;
  setSelectedRepeatInterval: (interval: number) => void;
  lists: any[];
  listIdPreselected: boolean;
}

export const useTaskForm = (
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
): UseTaskFormReturn => {
  const { createTask } = useTaskContext();
  const location = useLocation();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const { settings } = useSettings();
  const { lists } = useLists();
  const { db } = usePouchDB();

  // TODO use useHijriDate instead
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });
  const [selectedListId, setSelectedListId] = useState<string>(
    params.listId || "",
  );

  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepeat, setSelectedRepeat] = useState<TaskRepeat>("none");
  const [selectedRepeatInterval, setSelectedRepeatInterval] = useState(1);
  const { getToday } = useHijriDate();

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

      const attr: Record<string, any> = {};
      const isRecurring = selectedRepeat !== "none";

      if (isRecurring && taskData.atDateHijri) {
        // Create a RecurringTask template, then generate all instances
        const template = await createRecurringTask({
          name: taskData.taskName.trim(),
          description: taskData.taskDescription?.trim() || undefined,
          attributes: attr,
          baseDateHijri: taskData.atDateHijri as string,
          repeat: selectedRepeat,
          repeatInterval: selectedRepeatInterval,
          atTime: taskData.atTime,
          prayerTime: taskData.prayerTime as PrayerTime,
          lat: latitude,
          long: longitude,
          timezone: settings.timezone || "Asia/Jakarta",
          hijriDateOffset: offset,
          listId: selectedListId || undefined,
        });

        const taskRepository = new PouchDBTaskRepository(db);
        await generateOccurrencesForTemplate(
          template,
          taskRepository,
          Date.now(),
        );

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
          listId: selectedListId || undefined,
        };

        const result = await createTask(taskInput);

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
    selectedScheduleAt,
    setSelectedScheduleAt,
    selectedListId,
    setSelectedListId,
    selectedRepeat,
    setSelectedRepeat,
    selectedRepeatInterval,
    setSelectedRepeatInterval,
    lists,
    listIdPreselected: !!params.listId,
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
