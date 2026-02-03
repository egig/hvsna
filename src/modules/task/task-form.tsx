import { useState, useEffect } from "react";
import { useTask } from "./use-task";
import { useGoalStore } from "../goal/goalStore";
import { usePouchDB } from "../../pouchdb";
import type { Task } from "src/lib/types/task";
import type { Goal } from "../goal/goalStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { Check, Trash2 } from "lucide-react";
import { Navbar } from "../navigation";
import { useGoals } from "../goal/use-goals";
import CustomAttributeInput from "src/components/custom-attribute-input";
import BaseForm from "src/components/base-form";
import { FormInput } from "src/components/form-input";
import { useTracker } from "../tracker/use-tracker";
import type { Tracker } from "../tracker/trackerStore";
import { useRecurringTasks } from "../../hooks/useRecurringTasks";
import { HijriDateInput } from "../../components/hijri-date-input";

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
  const { task, loading, error, createTask, updateTask, getTask, reset } =
    useTask(taskId as string);
  const { goals } = useGoals();
  const { db } = usePouchDB();
  const { getGoalsFromDB } = useGoalStore();
  const { createRecurringTask } = useRecurringTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    task?.targetId as string,
  );
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedGoal?.trackerId);
  const { getTracker } = useTracker();

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

      console.log(tracker);

      const taskInput: any = {
        name: taskData.name.trim(),
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
      };

      // Handle scheduledAt - convert date string to timestamp if provided
      if (taskData.scheduledAt) {
        taskInput.scheduledAt = new Date(taskData.scheduledAt).getTime();
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
      if (taskData.repeat && taskData.repeat !== "none" && taskInput.scheduledAt) {
        try {
          await createRecurringTask({
            name: taskInput.name,
            targetId: taskInput.targetId,
            targetValue: taskInput.targetValue,
            attributes: taskInput.attributes,
            repeat: taskData.repeat,
            baseDate: taskInput.scheduledAt,
          });
        } catch (recurringError) {
          console.error("Failed to create recurring task:", recurringError);
          // Don't fail the main task creation if recurring task creation fails
        }
      }

      reset();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (taskId && onDelete && task) {
      if (
        confirm(
          `Are you sure you want to delete this task "${task.name}"? This action cannot be undone.`,
        )
      ) {
        onDelete(taskId);
      }
    }
  };

  return (
    <BaseForm title={taskId ? "Edit Task" : "New Task"} onSubmit={handleSubmit}>
      <FormInput
        name="name"
        label="Task Name"
        value={task ? task.name : ""}
        placeholder="Enter task name"
        disabled={isSubmitting}
        required={true}
        className="text-base"
      />

      <HijriDateInput
        name="scheduledAt"
        label="Scheduled Date & Time (Hijri)"
        value={task?.scheduledAt ? new Date(task.scheduledAt).toISOString().slice(0, 16) : ""}
        placeholder="Select Hijri date and time"
        disabled={isSubmitting}
        required={false}
        className="text-base"
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Repeat
        </label>
        <select
          name="repeat"
          defaultValue={task?.repeat || "none"}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="none">No repeat</option>
          <option value="daily">Daily at selected time</option>
          <option value="monthly">Monthly at selected date and time</option>
          <option value="yearly">Yearly at selected date and time</option>
        </select>
      </div>

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
    </BaseForm>
  );
}
