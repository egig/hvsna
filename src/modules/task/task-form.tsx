import { useState, useEffect, useRef } from "react";
import type { Task } from "src/lib/types/task";
import type { Goal } from "../goal/goalStore";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { ArrowUp, Trash2 } from "lucide-react";
import { useGoals } from "../goal/use-goals";
import CustomAttributeInput from "src/components/custom-attribute-input";
import { FormInput } from "src/components/form-input";
import { useTracker } from "../tracker/use-tracker";
import type { Tracker } from "../tracker/trackerStore";
import { useRecurringTasks } from "../../hooks/useRecurringTasks";
import { HijriDateInput } from "../../components/hijri-date-input";
import { HijriDate } from "src/lib/hijri";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";
import { useTaskForm } from "./task-form-hook";

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
    error,
    task,
    handleSubmit,
    handleDelete,
    selectedHijriDate,
    setSelectedHijriDate,
    selectedTime,
    setSelectedTime,
    selectedTargetId,
    setSelectedTargetId,
    isSubmitting,
    selectedGoal,
    trackerAttributes,
  } = useTaskForm(taskId || "", onSuccess, onError, onCancel, onDelete);
  const { goals } = useGoals();
  const { tracker } = useTracker(selectedGoal?.trackerId);
  const goalEnabled = useFeatureFlag("TASK_GOAL");

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the name input when the form opens
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Helper function to get attribute by ID
  const getAttributeById = (attributeId: string): any => {
    return trackerAttributes.find((attr: any) => attr.id === attributeId);
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
        ref={nameInputRef}
        name="name"
        defaultValue={task ? task.name : ""}
        placeholder="Task name"
        disabled={isSubmitting}
        required={true}
        className="text-base font-medium outline-none px-4 py-2 text-lg w-[100%]"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="task name"
      />
      <textarea
        name="description"
        placeholder="Description"
        className="text-sm px-4 h-[3rem] py-2 w-[100%] outline-none resize-none"
        defaultValue={task?.description || ""}
        disabled={isSubmitting}
        style={{ resize: "none" }}
      />

      <div className="mx-4">
        <HijriDateInput
          name="atEpochMillis"
          label="Scheduled Date & Time (Hijri)"
          value={selectedHijriDate as HijriDate}
          timeValue={selectedTime as string}
          placeholder="Date"
          disabled={isSubmitting}
          required={false}
          className="text-base"
          onChange={(hijriDate: any, time: string | null) => {
            setSelectedHijriDate(hijriDate);
            setSelectedTime(time);
          }}
        />
      </div>

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
              aria-label="target value"
            />
          )}

          {selectedGoal?.scope?.map((attributeId: string, index: number) => {
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
                  aria-label={`scope attribute ${attributeId}`}
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
          type="submit"
        >
          <ArrowUp />
        </button>
      </div>
    </form>
  );
}
