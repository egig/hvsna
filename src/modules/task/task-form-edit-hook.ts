import { useEffect, useState } from "react";
import { formatHijriDateString } from "./task-form-helpers";
import { useTaskContext } from "./task-context";
import { useHijriDate } from "../calendar/hijri";
import type { PrayerTime, Task, TaskUpdateInput } from "./types";
import { useSettings } from "../settings/useSettings";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";
import { useProjects } from "./use-projects";
import { useRecurringTasks } from "./use-recurring-tasks";
import { usePouchDB } from "../../pouchdb";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { RecurringTask } from "./recurring-task";
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
  projects: any[];
  wasTracker: boolean; // True if the parent template is a tracker
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
  onDelete?: (taskId: string) => void
): UseTaskFormReturn => {
  const { updateTask, deleteTask, deleteRecurringTaskSeries, getTask } =
    useTaskContext();
  const { projects } = useProjects();
  const {
    createRecurringTask,
    deleteRecurringTask,
    updateRecurringTask,
    getRecurringTask,
  } = useRecurringTasks();
  const { db } = usePouchDB();

  const [task, setTask] = useState<Task | null>(null);
  const [parentTemplate, setParentTemplate] = useState<RecurringTask | null>(
    null
  );
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createHijriDate } = useHijriDate();
  const [removeTime, setRemoveTime] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showRecurringEditScope, setShowRecurringEditScope] = useState(false);
  const [pendingOperation, setPendingOperation] =
    useState<PendingOperationData | null>(null);

  const [formData, setFormData] = useState<EditFormData>({
    scheduleAt: { dateHijri: null, time: "", prayerTime: "" },
    projectId: "",
    repeat: {
      repeat: "none",
      interval: 1,
      end: "never",
      endDate: null,
      endOccurrences: 1,
    },
    tags: [],
    asTracker: false,
    inputMode: undefined,
    unit: undefined,
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
  const latitude = settings.coordinate?.latitude || _fallback.latitude;
  const longitude = settings.coordinate?.longitude || _fallback.longitude;

  const handleSubmit = async (submittedFormData: FormData) => {
    const taskData = Object.fromEntries(submittedFormData) as unknown as {
      taskName: string;
      taskDescription: string;
    } & Partial<Task>;

    let atDateHijri: string | undefined;
    if (formData.scheduleAt.dateHijri) {
      atDateHijri = formatHijriDateString(
        formData.scheduleAt.dateHijri.year,
        formData.scheduleAt.dateHijri.month,
        formData.scheduleAt.dateHijri.day
      );
    }

    try {
      setIsSubmitting(true);

      const taskInput: TaskUpdateInput = {
        name: taskData.taskName.trim(),
        description: taskData.taskDescription?.trim() || undefined,
        attributes: {},
        atDateHijri,
        atTime: formData.scheduleAt.time || undefined,
        lat: latitude,
        long: longitude,
        timezone: settings.timezone || "Asia/Jakarta",
        hijriDateOffset: offset,
        prayerTime: (formData.scheduleAt.prayerTime as PrayerTime) || undefined,
        removeTime: removeTime,
        projectId:
          formData.projectId === "" ? null : formData.projectId || undefined,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      const wasRegular = !task?.recurringTaskId;
      const isNowRecurring = formData.repeat.repeat !== "none";
      let result: Task;

      if (wasRegular && isNowRecurring && atDateHijri) {
        // Promote: regular → recurring
        result = await promoteTaskToRecurring(
          taskId,
          taskInput,
          formData.repeat.repeat,
          formData.repeat.interval,
          {
            name: taskData.taskName.trim(),
            description: taskData.taskDescription?.trim() || undefined,
            baseDateHijri: atDateHijri,
            repeat: formData.repeat.repeat,
            repeatInterval: formData.repeat.interval,
            atTime: formData.scheduleAt.time,
            prayerTime: formData.scheduleAt.prayerTime as PrayerTime,
            lat: latitude,
            long: longitude,
            timezone: settings.timezone || "Asia/Jakarta",
            hijriDateOffset: offset,
            projectId: formData.projectId || undefined,
            repeatEnd:
              formData.repeat.end === "never" ? undefined : formData.repeat.end,
            repeatEndDate:
              formData.repeat.end === "on_date"
                ? formData.repeat.endDate ?? undefined
                : undefined,
            repeatEndOccurrences:
              formData.repeat.end === "after_occurrences"
                ? formData.repeat.endOccurrences
                : undefined,
            asTracker: formData.asTracker,
            inputMode: formData.inputMode,
            unit: formData.unit,
            target: formData.target,
            period: formData.period,
          },
          {
            createRecurringTask,
            updateTask,
            taskRepository: new PouchDBTaskRepository(db),
            todayEpoch: Date.now(),
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
      await deleteTask(taskId);
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
        // Update only this task instance
        result = await updateTask(
          pendingOperation.taskId,
          pendingOperation.taskInput
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
        result = await updateRecurringSeries(
          pendingOperation.taskId,
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
            prayerTime: pendingOperation.taskInput.prayerTime,
            repeat: pendingOperation.repeatConfig.repeat,
            repeatInterval: pendingOperation.repeatConfig.interval,
            projectId: pendingOperation.taskInput.projectId ?? undefined,
            asTracker: formData.asTracker,
            inputMode: formData.inputMode,
            unit: formData.unit,
            target: formData.target,
            period: formData.period,
          },
          {
            updateTask,
            updateRecurringTask,
            taskRepository: new PouchDBTaskRepository(db),
            todayEpoch: Date.now(),
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
      prayerTime: "",
    };

    if (task.atDateHijri) {
      const { year, month, day } = parseHijriDateString(task.atDateHijri);

      let hour: number | undefined;
      let minute: number | undefined;
      if (task.atTime) {
        const timeParts = parseTimeString(task.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      scheduleAt.dateHijri = createHijriDate(year, month, day, hour, minute);
      scheduleAt.time = task.atTime || "";
      scheduleAt.prayerTime = task.prayerTime || "";
    }

    setFormData({
      scheduleAt,
      projectId: task.projectId || "",
      tags: task.tags || [],
      repeat: {
        repeat: task.repeat ?? "none",
        interval: task.repeatInterval ?? 1,
        // repeatEnd lives on the RecurringTask template, not task instances — defaults used
        end: "never",
        endDate: null,
        endOccurrences: 1,
      },
      asTracker: parentTemplate?.asTracker || false,
      inputMode: parentTemplate?.inputMode,
      unit: parentTemplate?.unit,
      target: parentTemplate?.target,
      period: parentTemplate?.period,
    });
  }, [task, createHijriDate, parentTemplate]);

  useEffect(() => {
    if (taskId) {
      getTask(taskId).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask);
        }
      });
    }
  }, [taskId, getTask]);

  // Load parent RecurringTask template when task has recurringTaskId
  useEffect(() => {
    if (task?.recurringTaskId) {
      getRecurringTask(task.recurringTaskId)
        .then((template) => {
          setParentTemplate(template);
        })
        .catch((err) => {
          logger.error("Failed to load parent template:", err);
        });
    } else {
      setParentTemplate(null);
    }
  }, [task?.recurringTaskId, getRecurringTask]);

  const wasTracker = parentTemplate?.asTracker === true;

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
    projects,
    wasTracker,
  };
};
