import { useState, useEffect } from "react";
import { useTask } from "./use-task";
import type { Task } from "src/lib/types/task";
import type { Goal } from "../goal/goalStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { ArrowUp, Trash2 } from "lucide-react";
import { useGoals } from "../goal/use-goals";
import CustomAttributeInput from "src/components/custom-attribute-input";
import BaseForm from "src/components/base-form";
import { FormInput } from "src/components/form-input";
import { useTracker } from "../tracker/use-tracker";
import type { Tracker } from "../tracker/trackerStore";
import { useRecurringTasks } from "../../hooks/useRecurringTasks";
import { HijriDateInput } from "../../components/hijri-date-input";
import { HijriDate } from "src/lib/hijri";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";

interface TaskFormProps {
  taskId?: string | null;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskForm({
  taskId,
  onSuccess,
  onError,
  onCancel,
  onDelete,
}: TaskFormProps) {
  const {
    task,
    editingTaskId,
    loading,
    error,
    createTask,
    updateTask,
    getTask,
    reset,
    closeTaskForm,
    deleteTask,
    setEditingTaskId,
  } = useTask(taskId || undefined);
  const { goals } = useGoals();
  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    task?.targetId as string,
  );
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();
  const [selectedHijriDate, setSelectedHijriDate] = useState<HijriDate>();
  const goalEnabled = useFeatureFlag("TASk_GOAL");

  useEffect(() => {
    setEditingTaskId(taskId || null);
  }, [taskId]);

  useEffect(() => {
    if (task?.hijriDate) {
      // Parse YYYYMMDD format
      const year = parseInt(task.hijriDate.substring(0, 4));
      const month = parseInt(task.hijriDate.substring(4, 6));
      const day = parseInt(task.hijriDate.substring(6, 8));

      setSelectedHijriDate(
        new HijriDate(year, month, day, task.hour, task.minute),
      );
    }
  }, [task]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    setSelectedTargetId(task?.targetId || "");
  }, [task]);

  useEffect(() => {
    const goal = goals.find((g) => g.id === selectedTargetId);
    setSelectedGoal(goal || null);

    if (goal) {
      getTracker(goal?.trackerId as string).then((tr) => {
        setTracker(tr);
      });
    }
  }, [selectedTargetId, goals]);

  // Helper function to get attribute by ID
  const getAttributeById = (attributeId: string): any | undefined => {
    return trackerAttributes.find((attr) => attr.id === attributeId);
  };

  // Helper function to render attribute input using CustomAttributeInput
  const renderAttributeInput = (attribute: any, index: number) => {
    const value = task?.attributes?.[attribute.id];

    return (
      <CustomAttributeInput
        key={attribute.id}
        attr={attribute}
        value={value}
        disabled={isSubmitting}
      />
    );
  };

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as Task;

    if (selectedHijriDate) {
      const year = selectedHijriDate.year.toString().padStart(4, "0");
      const month = selectedHijriDate.month.toString().padStart(2, "0");
      const day = selectedHijriDate.day.toString().padStart(2, "0");
      taskData.hijriDate = `${year}${month}${day}`;

      taskData.hour = selectedHijriDate?.hour;
      taskData.minute = selectedHijriDate?.minute;
      // @ts-ignore
      taskData.scheduledAtEpochMillis = selectedHijriDate?.toDate().valueOf();
    }

    try {
      setIsSubmitting(true);

      // Extract scope values from form data
      var attr: Record<string, any> = {};
      if (selectedGoal?.scope) {
        for (let i = 0; i < selectedGoal.scope.length; i++) {
          const attributeId = selectedGoal.scope[i];
          let value = formData.get(attributeId) as string;
          attr[attributeId] = value;
        }
      }

      if (tracker?.type === "counter") {
        taskData.targetValue = 1;
      }

      if (tracker?.negative) {
        taskData.targetValue = -1 * (taskData.targetValue || 0);
      }

      const taskInput: any = {
        name: taskData.name.trim(),
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
        hijriDate: taskData.hijriDate,
        hour: taskData.hour,
        minute: taskData.minute,
      };

      // Handle scheduledAtEpochMillis - convert date string to timestamp if provided
      if (taskData.scheduledAtEpochMillis) {
        taskInput.scheduledAtEpochMillis = new Date(
          taskData.scheduledAtEpochMillis,
        ).getTime();
      }

      // Handle repeat - only include if not "none"
      if (taskData.repeat && taskData.repeat !== "none") {
        taskInput.repeat = taskData.repeat;
      }

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, taskInput);
      } else {
        result = await createTask(taskInput);
      }

      // Create recurring task if repeat is selected and not "none"
      if (
        taskData.repeat &&
        taskData.repeat !== "none" &&
        taskInput.scheduledAtEpochMillis
      ) {
        try {
          await createRecurringTask({
            name: taskInput.name,
            targetId: taskInput.targetId,
            targetValue: taskInput.targetValue,
            attributes: taskInput.attributes,
            repeat: taskData.repeat,
            baseDate: taskInput.scheduledAtEpochMillis,
          });
        } catch (recurringError) {
          console.error("Failed to create recurring task:", recurringError);
          // Don't fail the main task creation if recurring task creation fails
        }
      }

      reset();
      closeTaskForm();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error(err);
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    closeTaskForm();
    if (onCancel) {
      onCancel();
    }
  };

  const handleDelete = () => {
    if (taskId && task) {
      if (
        confirm(
          `Are you sure you want to delete this task "${task.name}"? This action cannot be undone.`,
        )
      ) {
        deleteTask(taskId).then(() => {
          reset();
          closeTaskForm();
          onDelete?.(taskId);
        });
      }
    }
  };

  return (

    <form
      className="h-[100%]"
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        await handleSubmit(formData);
      }}
    >
      <input
        name="name"
        defaultValue={task ? task.name : ""}
        placeholder="Task name"
        disabled={isSubmitting}
        required={true}
        className="text-base outline-none px-4 py-2 text-lg w-[100%]"
      />
      <textarea placeholder="Description" className="text-sm px-4 py-2 w-[100%] outline-none">
        
      </textarea>

      <HijriDateInput
        name="scheduledAtEpochMillis"
        label="Scheduled Date & Time (Hijri)"
        value={selectedHijriDate as HijriDate}
        placeholder="Date"
        disabled={isSubmitting}
        required={false}
        className="text-base"
        onChange={(hijriDate) => {
          setSelectedHijriDate(hijriDate);
        }}
      />

      {goalEnabled && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target (Optional)
          </label>
          <select
            // HACK to set this re-render
            key={Math.random()}
            defaultValue={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedTargetId && (
        <>
          {tracker?.type === "amount" && (
            <FormInput
              name="targetValue"
              label="Target Value"
              value={task?.targetValue?.toString() || ""}
              placeholder="Enter target value"
              type="number"
              disabled={isSubmitting}
              required={false}
              className="text-base"
            />
          )}

          {selectedGoal?.scope?.map((attributeId, index) => {
            const attribute = getAttributeById(attributeId);
            if (!attribute) {
              // Fallback to basic text input if attribute not found
              return (
                <FormInput
                  key={`${index}`}
                  name={`${attributeId}`}
                  label={`Scope: ${attributeId}`}
                  value={task?.attributes?.[index]?.toString() || ""}
                  placeholder={`Enter value for ${attributeId}`}
                  type="text"
                  disabled={isSubmitting}
                  required={false}
                  className="text-base"
                />
              );
            }

            return renderAttributeInput(attribute, index);
          })}
        </>
      )}

      {/* Delete Button - Only show for existing tasks */}
      {taskId && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-full px-4 py-3 hover:text-red-600 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Task
          </button>
        </div>
      )}

      <div className="flex justify-end p-4">
        <button
        className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
        aria-label="Add new task"
        type="submit">
          <ArrowUp/>
        </button>
      </div>
    </form>
  );
}
