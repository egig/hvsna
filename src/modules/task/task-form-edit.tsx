import { useEffect, useRef } from "react";
import type { Task } from "src/lib/types/task";
import type { Goal } from "../goal/goalStore";
import { ArrowUp, Trash2 } from "lucide-react";
import { useGoals } from "../goal/use-goals";
import CustomAttributeInput from "src/components/custom-attribute-input";
import { FormInput } from "src/components/form-input";
import { useTracker } from "../tracker/use-tracker";
import { HijriDateInput } from "../../components/hijri-date-input";
import { HijriDate } from "src/lib/hijri";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";
import { useTaskFormEdit } from "./task-form-edit-hook";
import { useLanguageContext } from "../../contexts/LanguageContext";

interface TaskFormEditProps {
  taskId: string;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskFormEdit({
  taskId,
  onSuccess,
  onError,
  onCancel,
  onDelete,
}: TaskFormEditProps) {
  const { t } = useLanguageContext();
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
  } = useTaskFormEdit(taskId, onSuccess, onError, onCancel, onDelete);
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
        name="taskName"
        defaultValue={task ? task.name : ""}
        placeholder={t("task_name")}
        disabled={isSubmitting}
        required={true}
        className="text-base font-medium outline-none px-4 py-2 text-lg w-[100%]"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={t("task_name")}
      />
      <textarea
        name="taskDescription"
        placeholder={t("description")}
        className="text-sm px-4 h-[3rem] py-2 w-[100%] outline-none resize-none"
        defaultValue={task?.description || ""}
        disabled={isSubmitting}
        style={{ resize: "none" }}
      />

      <div className="mx-4">
        <HijriDateInput
          name="atEpochMillis"
          label={t("scheduled_date_time_hijri")}
          value={selectedHijriDate as HijriDate}
          timeValue={selectedTime as string}
          placeholder={t("date")}
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
            {t("target_optional")}
          </label>
          <select
            // HACK to set this re-render
            key={Math.random()}
            defaultValue={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)] dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("select_a_goal")}</option>
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
              label={t("target_value")}
              value={task?.targetValue?.toString() || ""}
              placeholder={t("enter_target_value")}
              type="number"
              disabled={isSubmitting}
              required={false}
              className="text-base"
              aria-label={t("target_value")}
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
                  label={`${t("scope")}: ${attributeId}`}
                  value={task?.attributes?.[index]?.toString() || ""}
                  placeholder={t("enter_value_for_attribute", {
                    attribute: attributeId,
                  })}
                  type="text"
                  disabled={isSubmitting}
                  required={false}
                  className="text-base"
                  aria-label={`${t("scope_attribute")} ${attributeId}`}
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
            {t("delete_task")}
          </button>
        </div>
      )}

      <div className="flex justify-end p-4">
        <button
          className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label={t("add_new_task")}
          type="submit"
        >
          <ArrowUp />
        </button>
      </div>
    </form>
  );
}
