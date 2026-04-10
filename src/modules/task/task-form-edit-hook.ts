import { useEffect, useState } from "react";
import { formatHijriDateString } from "./task-form-helpers";
import { useTaskContext } from "./task-context";
import { useHijriDate } from "../calendar/hijri";
import type { PrayerTime, Task, TaskRepeat, TaskUpdateInput } from "./types";
import { useSettings } from "../settings/useSettings";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";
import type { TaskScheduleAt } from "./task-form-hook";
import { useLists } from "./use-lists";
import { useRecurringTasks } from "./use-recurring-tasks";
import { usePouchDB } from "../../pouchdb";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import {
  promoteTaskToRecurring,
  demoteTaskFromRecurring,
  demoteTaskFromRecurringAndDeleteFuture,
} from "./recurring-task-conversion";
import logger from "src/modules/logger";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  isSubmitting: boolean;
  handleSubmit: (f: FormData) => void;
  handleDelete: () => void;
  handleDeleteSingle: () => Promise<void>;
  handleDeleteAll: () => Promise<void>;
  showDeleteOptions: boolean;
  setShowDeleteOptions: (v: boolean) => void;
  showRecurringEditScope: boolean;
  setShowRecurringEditScope: (v: boolean) => void;
  handleDemoteThisOnly: () => Promise<void>;
  handleDemoteAllFuture: () => Promise<void>;
  removeTime: boolean;
  setRemoveTime: (removeTime: boolean) => void;
  selectedScheduleAt: TaskScheduleAt;
  setSelectedScheduleAt: any;
  selectedListId: string;
  setSelectedListId: (listId: string) => void;
  selectedRepeat: TaskRepeat;
  setSelectedRepeat: (repeat: TaskRepeat) => void;
  selectedRepeatInterval: number;
  setSelectedRepeatInterval: (interval: number) => void;
  selectedRepeatEnd: RepeatEnd;
  setSelectedRepeatEnd: (v: RepeatEnd) => void;
  selectedRepeatEndDate: string | null;
  setSelectedRepeatEndDate: (v: string | null) => void;
  selectedRepeatEndOccurrences: number;
  setSelectedRepeatEndOccurrences: (v: number) => void;
  lists: any[];
}

export const useTaskFormEdit = (
  taskId: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
  onDelete?: (taskId: string) => void,
): UseTaskFormReturn => {
  const { updateTask, deleteTask, deleteRecurringTaskSeries, getTask } =
    useTaskContext();
  const { lists } = useLists();
  const { createRecurringTask, deleteRecurringTask } = useRecurringTasks();
  const { db } = usePouchDB();

  const [task, setTask] = useState<Task | null>(null);
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createHijriDate } = useHijriDate();
  const [removeTime, setRemoveTime] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedRepeat, setSelectedRepeat] = useState<TaskRepeat>("none");
  const [selectedRepeatInterval, setSelectedRepeatInterval] = useState(1);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showRecurringEditScope, setShowRecurringEditScope] = useState(false);
  const [pendingDemoteData, setPendingDemoteData] = useState<{
    taskId: string;
    taskInput: TaskUpdateInput;
    task: Task;
  } | null>(null);
  const [selectedRepeatEnd, setSelectedRepeatEnd] = useState<RepeatEnd>("never");
  const [selectedRepeatEndDate, setSelectedRepeatEndDate] = useState<string | null>(null);
  const [selectedRepeatEndOccurrences, setSelectedRepeatEndOccurrences] = useState(1);

  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });

  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088;
  const longitude = settings.coordinate?.longitude || 106.8456;

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

      const taskInput: TaskUpdateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        attributes: {},
        atDateHijri: taskData.atDateHijri,
        atTime: taskData.atTime,
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
        hijriDateOffset: offset,
        prayerTime: selectedScheduleAt?.prayerTime as PrayerTime,
        removeTime: removeTime,
        listId: selectedListId === "" ? null : selectedListId || undefined,
      };

      const wasRegular = !task?.recurringTaskId;
      const isNowRecurring = selectedRepeat !== "none";
      let result: Task;

      if (wasRegular && isNowRecurring && taskData.atDateHijri) {
        // Promote: regular → recurring
        result = await promoteTaskToRecurring(
          taskId,
          taskInput,
          selectedRepeat,
          selectedRepeatInterval,
          {
            name: taskData.taskName.trim(),
            description: taskData.taskDescription?.trim() || undefined,
            baseDateHijri: taskData.atDateHijri,
            repeat: selectedRepeat,
            repeatInterval: selectedRepeatInterval,
            atTime: taskData.atTime,
            prayerTime: taskData.prayerTime as PrayerTime,
            lat: latitude,
            long: longitude,
            timezone: settings.timezone || "Asia/Jakarta",
            hijriDateOffset: offset,
            listId: selectedListId || undefined,
            repeatEnd: selectedRepeatEnd === "never" ? undefined : selectedRepeatEnd,
            repeatEndDate: selectedRepeatEnd === "on_date" ? selectedRepeatEndDate ?? undefined : undefined,
            repeatEndOccurrences: selectedRepeatEnd === "after_occurrences" ? selectedRepeatEndOccurrences : undefined,
          },
          {
            createRecurringTask,
            updateTask,
            taskRepository: new PouchDBTaskRepository(db),
            todayEpoch: Date.now(),
          },
        );
      } else if (!wasRegular && !isNowRecurring) {
        // Intercept: show scope modal — completion handled by handleDemoteThisOnly / handleDemoteAllFuture
        setPendingDemoteData({ taskId, taskInput, task: task! });
        setShowRecurringEditScope(true);
        setIsSubmitting(false);
        return;
      } else {
        // Normal update — apply repeat fields if set
        if (isNowRecurring) {
          taskInput.repeat = selectedRepeat;
          taskInput.repeatInterval = selectedRepeatInterval;
        }
        result = await updateTask(taskId, taskInput);
      }

      setTask(null);
      if (onSuccess) {
        onSuccess(result!);
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

  const handleDelete = () => {
    if (!taskId || !task) return;
    if (task.recurringTaskId) {
      setShowDeleteOptions(true);
    } else {
      if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
        deleteTask(taskId)
          .then(() => {
            setTask(null);
            onDelete?.(taskId);
          })
          .catch((error) => {
            logger.error(error);
            onError?.(
              error instanceof Error ? error.message : "Failed to delete task",
            );
          });
      }
    }
  };

  const handleDeleteSingle = async () => {
    setShowDeleteOptions(false);
    try {
      await deleteTask(taskId);
      setTask(null);
      onDelete?.(taskId);
    } catch (error) {
      logger.error(error);
      onError?.(
        error instanceof Error ? error.message : "Failed to delete task",
      );
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteOptions(false);
    try {
      await deleteRecurringTaskSeries(task!.recurringTaskId!);
      setTask(null);
      onDelete?.(taskId);
    } catch (error) {
      logger.error(error);
      onError?.(
        error instanceof Error ? error.message : "Failed to delete recurring tasks",
      );
    }
  };

  const handleDemoteThisOnly = async () => {
    if (!pendingDemoteData) return;
    setShowRecurringEditScope(false);
    setIsSubmitting(true);
    try {
      const result = await demoteTaskFromRecurring(
        pendingDemoteData.taskId,
        pendingDemoteData.taskInput,
        updateTask,
      );
      setPendingDemoteData(null);
      setTask(null);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      logger.error(err);
      if (onError) onError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoteAllFuture = async () => {
    if (!pendingDemoteData) return;
    setShowRecurringEditScope(false);
    setIsSubmitting(true);
    try {
      const result = await demoteTaskFromRecurringAndDeleteFuture(
        pendingDemoteData.taskId,
        pendingDemoteData.taskInput,
        pendingDemoteData.task,
        {
          updateTask,
          deleteRecurringTask,
          taskRepository: new PouchDBTaskRepository(db),
        },
      );
      setPendingDemoteData(null);
      setTask(null);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      logger.error(err);
      if (onError) onError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!!task?.atDateHijri) {
      const { year, month, day } = parseHijriDateString(task.atDateHijri);

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

    if (task?.listId) {
      setSelectedListId(task.listId);
    }

    setSelectedRepeat(task?.repeat ?? "none");
    setSelectedRepeatInterval(task?.repeatInterval ?? 1);
    // repeatEnd lives on the RecurringTask template, not on Task instances.
    // Initialize to defaults; can be loaded from the template in a future enhancement.
    setSelectedRepeatEnd("never");
    setSelectedRepeatEndDate(null);
    setSelectedRepeatEndOccurrences(1);
  }, [task, createHijriDate]);

  useEffect(() => {
    if (taskId) {
      getTask(taskId).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask);
        }
      });
    }
  }, [taskId, getTask]);

  return {
    task,
    error: null,
    isSubmitting,
    handleSubmit,
    handleDelete,
    handleDeleteSingle,
    handleDeleteAll,
    showDeleteOptions,
    setShowDeleteOptions,
    showRecurringEditScope,
    setShowRecurringEditScope,
    handleDemoteThisOnly,
    handleDemoteAllFuture,
    removeTime,
    setRemoveTime,
    selectedScheduleAt,
    setSelectedScheduleAt,
    selectedListId,
    setSelectedListId,
    selectedRepeat,
    setSelectedRepeat,
    selectedRepeatInterval,
    setSelectedRepeatInterval,
    selectedRepeatEnd,
    setSelectedRepeatEnd,
    selectedRepeatEndDate,
    setSelectedRepeatEndDate,
    selectedRepeatEndOccurrences,
    setSelectedRepeatEndOccurrences,
    lists,
  };
};
