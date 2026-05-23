import { useEffect, useState } from "react";
import {
  useTaskEpoch,
  parseHijriDateString,
  parseTimeString,
} from "./task-form-helpers";
import { HijriDate } from "../calendar/hijri";
import { useTaskContext } from "./task-context";
import { useHijriDate } from "../calendar/hijri";
import type { PrayerTime, Task, TaskUpdateInput } from "@/domain/task";
import { useSettings } from "../settings";
import { useRecurringTasks } from "./use-recurring-tasks";
import { usePouchDB } from "../../pouchdb";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import {
  promoteTaskToRecurring,
  demoteTaskFromRecurring,
  demoteTaskFromRecurringAndDeleteFuture,
  updateRecurringSeries,
} from "./recurring-task-conversion";
import logger from "src/modules/logger";
import { getCoordinateFromTimezone } from "@/config";
import type {
  RepeatConfig,
  TaskFormData,
  TaskScheduleAt,
} from "./task-form-types";

// EditFormData is structurally identical to TaskFormData — aliased for clarity
type EditFormData = TaskFormData;

// "demote" strips recurring status; "edit" keeps repeat set but updates template/instance
type PendingOperationType = "demote" | "edit";

interface PendingOperationData {
  type: PendingOperationType;
  taskId: string;
  taskInput: TaskUpdateInput;
  task: Task;
  repeatConfig: RepeatConfig;
}

export interface UseTaskFormReturn {
  task: Task | null;
  error: string | null;
  isSubmitting: boolean;
  showDeleteOptions: boolean;
  showRecurringEditScope: boolean;
  removeTime: boolean;
  formData: EditFormData;
  handleSubmit: (f: FormData) => void;
  handleDelete: () => void;
  handleDeleteSingle: () => Promise<void>;
  handleDeleteAll: () => Promise<void>;
  setShowDeleteOptions: (v: boolean) => void;
  setShowRecurringEditScope: (v: boolean) => void;
  handleScopeThisOnly: () => Promise<void>;
  handleScopeAllFuture: () => Promise<void>;
  setRemoveTime: (removeTime: boolean) => void;
  updateFormData: (updates: Partial<EditFormData>) => void;
  updateScheduleAt: (updates: Partial<TaskScheduleAt>) => void;
  updateRepeatConfig: (updates: Partial<RepeatConfig>) => void;
}

export const useTaskFormEdit = (
  taskId: string,
  onSuccess?: (task: Task) => void,
  onError?: (error: string) => void,
  onDelete?: (taskId: string) => void,
  initialTask?: Task
): UseTaskFormReturn => {
  const {
    updateTask,
    deleteTask,
    deleteRecurringTaskSeries,
    getTask,
    materializeVirtualTask,
  } = useTaskContext();
  const {
    createRecurringTask,
    deleteRecurringTask,
    updateRecurringTask,
    getRecurringTask,
  } = useRecurringTasks();
  const { db } = usePouchDB();

  const [task, setTask] = useState<Task | null>(initialTask ?? null);
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createHijriDate } = useHijriDate();
  const [removeTime, setRemoveTime] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showRecurringEditScope, setShowRecurringEditScope] = useState(false);
  const [pendingOperation, setPendingOperation] =
    useState<PendingOperationData | null>(null);

  const getTaskEpoch = useTaskEpoch();

  const [formData, setFormData] = useState<EditFormData>({
    scheduleAt: { dateHijri: null, time: "" },
    repeat: {
      repeat: "none",
      interval: 1,
      end: "never",
      endDate: null,
      endOccurrences: 1,
      useGregorian: false,
    },
    tags: [],
  });

  const updateFormData = (updates: Partial<EditFormData>) => {
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

  const offset = settings.manualDateOffset || 0;
  const _fallback = getCoordinateFromTimezone(settings.timezone ?? "");
  const latitude = settings.location?.lat || _fallback.latitude;
  const longitude = settings.location?.lng || _fallback.longitude;

  const handleSubmit = async (submittedFormData: FormData) => {
    const taskData = Object.fromEntries(submittedFormData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    let atEpochMillis = null;
    if (formData.scheduleAt.dateHijri) {
      const { year, month, day } = formData.scheduleAt.dateHijri;
      atEpochMillis = getTaskEpoch(
        year,
        month,
        day,
        formData.scheduleAt.time
      ) as number;
    }

    try {
      setIsSubmitting(true);

      const taskInput: TaskUpdateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        atEpochMillis,
        atTime: formData.scheduleAt.time || undefined,
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
        hijriDateOffset: offset,
        removeTime: removeTime,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      const wasRegular = !task?.recurringTaskId;
      const isNowRecurring = formData.repeat.repeat !== "none";
      let result: Task;

      if (wasRegular && isNowRecurring && formData.scheduleAt.dateHijri) {
        // Promote: regular → recurring
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
        result = await promoteTaskToRecurring(
          taskId,
          taskInput,
          formData.repeat.repeat,
          formData.repeat.interval,
          {
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
            repeatEnd:
              formData.repeat.end === "never" ? undefined : formData.repeat.end,
            repeatEndEpoch,
            repeatEndOccurrences:
              formData.repeat.end === "after_occurrences"
                ? formData.repeat.endOccurrences
                : undefined,
            useGregorian: formData.repeat.useGregorian,
          },
          {
            createRecurringTask,
            updateTask,
            taskRepository: new PouchDBTaskRepository(db),
          }
        );
      } else if (!wasRegular && !isNowRecurring) {
        // Demote: recurring → regular — show scope modal
        setPendingOperation({
          type: "demote",
          taskId,
          taskInput,
          task: task!,
          repeatConfig: formData.repeat,
        });
        setShowRecurringEditScope(true);
        setIsSubmitting(false);
        return;
      } else if (!wasRegular && isNowRecurring) {
        // Editing a recurring task — show scope modal to decide instance vs series update
        setPendingOperation({
          type: "edit",
          taskId,
          taskInput,
          task: task!,
          repeatConfig: formData.repeat,
        });
        setShowRecurringEditScope(true);
        setIsSubmitting(false);
        return;
      } else {
        // Regular task update (wasRegular && !isNowRecurring, or no date for recurring promotion)
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
              error instanceof Error ? error.message : "Failed to delete task"
            );
          });
      }
    }
  };

  const handleDeleteSingle = async () => {
    setShowDeleteOptions(false);
    try {
      const idToDelete = task?.isVirtual
        ? ((await materializeVirtualTask(task)).id as string)
        : taskId;
      await deleteTask(idToDelete);
      setTask(null);
      onDelete?.(taskId);
    } catch (error) {
      logger.error(error);
      onError?.(
        error instanceof Error ? error.message : "Failed to delete task"
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
          : "Failed to delete recurring tasks"
      );
    }
  };

  const handleScopeThisOnly = async () => {
    if (!pendingOperation) return;
    setShowRecurringEditScope(false);
    setIsSubmitting(true);
    try {
      let result: Task;
      if (pendingOperation.type === "demote") {
        result = await demoteTaskFromRecurring(
          pendingOperation.taskId,
          pendingOperation.taskInput,
          updateTask
        );
      } else {
        // Update only this task instance — materialize first if virtual
        const targetId = pendingOperation.task.isVirtual
          ? ((await materializeVirtualTask(pendingOperation.task)).id as string)
          : pendingOperation.taskId;
        result = await updateTask(targetId, pendingOperation.taskInput);
      }
      setPendingOperation(null);
      setTask(null);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      logger.error(err);
      if (onError)
        onError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScopeAllFuture = async () => {
    if (!pendingOperation) return;
    setShowRecurringEditScope(false);
    setIsSubmitting(true);
    try {
      let result: Task;
      if (pendingOperation.type === "demote") {
        result = await demoteTaskFromRecurringAndDeleteFuture(
          pendingOperation.taskId,
          pendingOperation.taskInput,
          pendingOperation.task,
          {
            updateTask,
            deleteRecurringTask,
            taskRepository: new PouchDBTaskRepository(db),
          }
        );
      } else {
        // Update this instance, delete future instances, update the template,
        // and regenerate occurrences with the new repeat pattern
        const seriesTargetId = pendingOperation.task.isVirtual
          ? ((await materializeVirtualTask(pendingOperation.task)).id as string)
          : pendingOperation.taskId;
        result = await updateRecurringSeries(
          seriesTargetId,
          {
            ...pendingOperation.taskInput,
            repeat: pendingOperation.repeatConfig.repeat,
            repeatInterval: pendingOperation.repeatConfig.interval,
          },
          pendingOperation.task,
          {
            name: pendingOperation.taskInput.name,
            description: pendingOperation.taskInput.description,
            atTime: pendingOperation.taskInput.atTime,
            repeat: pendingOperation.repeatConfig.repeat,
            repeatInterval: pendingOperation.repeatConfig.interval,
          },
          {
            updateTask,
            updateRecurringTask,
            taskRepository: new PouchDBTaskRepository(db),
          }
        );
      }
      setPendingOperation(null);
      setTask(null);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      logger.error(err);
      if (onError)
        onError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!task) return;

    const scheduleAt: TaskScheduleAt = {
      dateHijri: null,
      time: "",
    };

    if (task.atEpochMillis) {
      const hijri = HijriDate.fromDate(new Date(task.atEpochMillis), {
        latitude,
        longitude,
        offset,
      });

      let hour: number | undefined;
      let minute: number | undefined;
      if (task.atTime) {
        const timeParts = parseTimeString(task.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      scheduleAt.dateHijri = createHijriDate(
        hijri.year,
        hijri.month,
        hijri.day,
        hour,
        minute
      );
      scheduleAt.time = task.atTime || "";
    }

    setFormData({
      scheduleAt,
      tags: task.tags || [],
      repeat: {
        repeat: task.repeat ?? "none",
        interval: task.repeatInterval ?? 1,
        // repeatEnd lives on the RecurringTask template, not task instances — defaults used
        end: "never",
        endDate: null,
        endOccurrences: 1,
        useGregorian: false,
      },
    });
  }, [task, createHijriDate]);

  useEffect(() => {
    if (initialTask?.isVirtual) return;
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
    handleScopeThisOnly,
    handleScopeAllFuture,
    removeTime,
    setRemoveTime,
    formData,
    updateFormData,
    updateScheduleAt,
    updateRepeatConfig,
  };
};
