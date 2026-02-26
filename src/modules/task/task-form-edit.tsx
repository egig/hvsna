import { useEffect, useRef, useState } from "react";
import type { Goal } from "../goal/goalStore";
import { ArrowUp, Trash2, Eye, Info } from "lucide-react";
import { useGoals } from "../goal/use-goals";
import CustomAttributeInput from "src/ui/custom-attribute-input";
import { FormInput } from "src/ui/form-input";
import { useTracker } from "../tracker/use-tracker";
import { DatePrayerInput } from "./date-prayer-input";
import { useTaskFormEdit } from "./task-form-edit-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation";
import type { Task } from "./types";
import { useFeatureFlag } from "../feature-flags/useFeatureFlags";
import type { HijriDate } from "../calendar/hijri";
import { Modal } from "../navigation/modal";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toHijriDate, formatDate } = useHijriDate();
  const {
    error,
    task,
    handleSubmit,
    handleDelete,
    selectedTargetId,
    setSelectedTargetId,
    isSubmitting,
    selectedGoal,
    trackerAttributes,
    setRemoveTime,
    selectedScheduleAt,
    setSelectedScheduleAt,
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
      <Navbar
        title="Edit Task"
        showBackButton={false}
        rightAction={
          <button
            className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
            aria-label={t("add_new_task")}
            type="submit"
          >
            <ArrowUp />
          </button>
        }
      />
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

      <DatePrayerInput
        hijriDate={selectedScheduleAt.dateHijri as HijriDate}
        atTime={selectedScheduleAt.time || ""}
        prayerTime={selectedScheduleAt.prayerTime || ""}
        isSubmitting={isSubmitting}
        onChange={(hijriDate, time, prayerTime) => {
          setSelectedScheduleAt({
            dateHijri: hijriDate,
            time: time,
            prayerTime: prayerTime,
          });
          if (!time && !prayerTime) {
            setRemoveTime(true);
          }
        }}
      />

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

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDetailsModal(true)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Info size={18} />
            {t("view_details")}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 hover:text-[var(--hvsna-danger-color-hover)] text-[var(--hvsna-danger-color)] rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            {t("delete_task")}
          </button>
        </div>
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={t("task_details")}
      >
        {task && (
          <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto text-sm">
            {/* Basic Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                {t("basic_information")}
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div>
                  <span className="font-medium text-gray-600">
                    {t("task_name")}:
                  </span>
                  <p className="text-gray-900">{task.name}</p>
                </div>
                {task.description && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("description")}:
                    </span>
                    <p className="text-gray-900">{task.description}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">
                    {t("status")}:
                  </span>
                  <p className="text-gray-900">
                    {task.status === 1 ? t("completed") : t("pending")}
                  </p>
                </div>
              </div>
            </div>

            {/* Date Information */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                {t("date_information")}
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                {task.atEpochMillis && (
                  <>
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("epoch_millis")}:
                      </span>
                      <p className="text-gray-900 font-mono text-sm">
                        {task.atEpochMillis}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("gregorian_date")}:
                      </span>
                      <p className="text-gray-900">
                        {new Date(task.atEpochMillis).toLocaleDateString()}{" "}
                        {new Date(task.atEpochMillis).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("hijri_date")}:
                      </span>
                      <p className="text-gray-900">
                        {formatDate(
                          toHijriDate(new Date(task.atEpochMillis)),
                          "DD MMMM YYYY",
                        )}
                      </p>
                    </div>
                  </>
                )}
                {task.atDateHijri && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("scheduled_hijri_date")}:
                    </span>
                    <p className="text-gray-900">{task.atDateHijri}</p>
                  </div>
                )}
                {task.atTime && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("scheduled_time")}:
                    </span>
                    <p className="text-gray-900">{task.atTime}</p>
                  </div>
                )}
                {task.prayerTime && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("prayer_time")}:
                    </span>
                    <p className="text-gray-900">{task.prayerTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            {(task.lat || task.long || task.timezone) && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {t("location_information")}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  {task.lat && (
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("latitude")}:
                      </span>
                      <p className="text-gray-900">{task.lat}</p>
                    </div>
                  )}
                  {task.long && (
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("longitude")}:
                      </span>
                      <p className="text-gray-900">{task.long}</p>
                    </div>
                  )}
                  {task.timezone && (
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("timezone")}:
                      </span>
                      <p className="text-gray-900">{task.timezone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Goal Information */}
            {task.targetId && selectedGoal && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {t("goal_information")}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("goal")}:
                    </span>
                    <p className="text-gray-900">{selectedGoal.name}</p>
                  </div>
                  {task.targetValue !== undefined && (
                    <div>
                      <span className="font-medium text-gray-600">
                        {t("target_value")}:
                      </span>
                      <p className="text-gray-900">{task.targetValue}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">{t("timestamps")}</h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                {task.createdAt && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("created_at")}:
                    </span>
                    <p className="text-gray-900">
                      {new Date(task.createdAt).toLocaleDateString()}{" "}
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                {task.updatedAt && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("updated_at")}:
                    </span>
                    <p className="text-gray-900">
                      {new Date(task.updatedAt).toLocaleDateString()}{" "}
                      {new Date(task.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("completed_at")}:
                    </span>
                    <p className="text-gray-900">
                      {new Date(task.completedAt).toLocaleDateString()}{" "}
                      {new Date(task.completedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {task.repeat && task.repeat !== "none" && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {t("repeat_information")}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-600">
                      {t("repeat")}:
                    </span>
                    <p className="text-gray-900">{task.repeat}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </form>
  );
}
