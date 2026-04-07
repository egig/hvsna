import { useEffect, useState } from "react";
import { formatHijriDateString } from "./task-form-helpers";
import { useTaskContext } from "./task-context";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import type { PrayerTime, Task, TaskRepeat, TaskUpdateInput } from "./types";
import { useSettings } from "../settings/useSettings";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";
import type { TaskScheduleAt } from "./task-form-hook";
import { useLists } from "./use-lists";
import logger from "src/modules/logger";

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
  lists: any[];
}

export const useTaskFormEdit = (
  taskId: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onCancel?: () => void,
  onDelete?: (taskId: string) => void,
): UseTaskFormReturn => {
  // Use TaskProvider's updateTask and deleteTask mutations
  const { updateTask, deleteTask, deleteRecurringTaskSeries, getTask } =
    useTaskContext();
  const { lists } = useLists();

  const [task, setTask] = useState<Task | null>(null);
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToday, createHijriDate } = useHijriDate();
  const [removeTime, setRemoveTime] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedRepeat, setSelectedRepeat] = useState<TaskRepeat>("none");
  const [selectedRepeatInterval, setSelectedRepeatInterval] = useState(1);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const [selectedScheduleAt, setSelectedScheduleAt] = useState<TaskScheduleAt>({
    dateHijri: null,
    time: "",
    prayerTime: "",
  });

  // TODO use useHijriDate instead
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude || -6.2088; // Default Jakarta coordinates
  const longitude = settings.coordinate?.longitude || 106.8456; // Default Jakarta coordinates

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

      // Extract scope values from form data
      const attr: Record<string, any> = {};
      const taskInput: TaskUpdateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        attributes: attr,
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

      // Apply the controlled repeat state
      if (selectedRepeat !== "none") {
        taskInput.repeat = selectedRepeat;
        taskInput.repeatInterval = selectedRepeatInterval;
      }

      // Use TaskProvider's updateTask directly
      const result = await updateTask(taskId, taskInput);
      setTask(null);

      if (onSuccess) {
        onSuccess(result);
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
      // Show choice modal for recurring tasks
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
        error instanceof Error
          ? error.message
          : "Failed to delete recurring tasks",
      );
    }
  };

  useEffect(() => {
    if (!!task?.atDateHijri) {
      // Parse YYYYMMDD format using helper function
      const { year, month, day } = parseHijriDateString(task.atDateHijri);

      // Parse time if available using helper function
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

    // Set listId from task
    if (task?.listId) {
      setSelectedListId(task.listId);
    }

    // Set repeat from task
    setSelectedRepeat(task?.repeat ?? "none");
    setSelectedRepeatInterval(task?.repeatInterval ?? 1);
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
    lists,
  };
};
