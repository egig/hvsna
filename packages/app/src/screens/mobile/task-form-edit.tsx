import React, { useEffect, useRef, useState } from "react";
import { HvTrash2, HvInfo, HvMoreVertical, HvCheck } from "@/modules/icons";
import { NavActionButton } from "@/modules/components/nav-action-button";
import { Menu } from "@base-ui/react/menu";
import { DatePrayerInput } from "@/modules/task/date-prayer-input";
import { useTaskFormEdit } from "@/modules/task/task-form-edit-hook";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { ModalNavbar } from "@/modules/navigation/modal-navbar";
import TaskPreview from "@/modules/task/task-preview";
import type { Task } from "@/domain/task";
import { Modal } from "./modal";
import TimeInputMobile from "./time-input";
import { TagInput } from "./tag-input";

interface TaskFormEditProps {
  taskId: string;
  initialTask?: Task;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskFormEditMobile({
  taskId,
  initialTask,
  onSuccess,
  onError,
  onDelete,
}: TaskFormEditProps) {
  const { t } = useLanguageContext();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const {
    error,
    task,
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
    isSubmitting,
    setRemoveTime,
    formData,
    updateFormData,
    updateScheduleAt,
    updateRepeatConfig,
  } = useTaskFormEdit(taskId, onSuccess, onError, onDelete, initialTask);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const menu = (
    <Menu.Root>
      <Menu.Trigger
        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-colors z-50"
        aria-label={t("more_options")}
      >
        <HvMoreVertical size={20} />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner className="z-[9999]">
          <Menu.Popup className="z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
            <Menu.Item
              onClick={() => setShowDetailsModal(true)}
              disabled={isSubmitting}
              className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
            >
              <HvInfo size={18} />
              {t("view_details")}
            </Menu.Item>
            <Menu.Item
              onClick={handleDelete}
              disabled={isSubmitting}
              closeOnClick={true}
              className="px-4 py-3 text-left hover:text-[var(--hvsna-danger-color-hover)] text-[var(--hvsna-danger-color)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
            >
              <HvTrash2 size={18} />
              {t("delete_task")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  const modals = (
    <>
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={t("task_details")}
      >
        {task && <TaskPreview task={task} />}
      </Modal>

      <Modal
        isOpen={showDeleteOptions}
        onClose={() => setShowDeleteOptions(false)}
        title={t("delete_task")}
      >
        <div className="flex flex-col gap-3 p-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("delete_recurring_task_prompt")}
          </p>
          <button
            onClick={handleDeleteSingle}
            className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="font-medium">{t("delete_this_task")}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("delete_this_task_desc")}
            </div>
          </button>
          <button
            onClick={handleDeleteAll}
            className="w-full px-4 py-3 text-left rounded-lg border border-red-200 dark:border-red-900 text-[var(--hvsna-danger-color)] hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <div className="font-medium">{t("delete_all_recurring")}</div>
            <div className="text-sm opacity-70">
              {t("delete_all_recurring_desc")}
            </div>
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showRecurringEditScope}
        onClose={() => setShowRecurringEditScope(false)}
        title={t("change_recurring_scope")}
      >
        <div className="flex flex-col gap-3 p-2">
          <button
            onClick={handleScopeThisOnly}
            className="w-full px-4 py-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="font-medium">{t("change_this_event_only")}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("change_this_event_only_desc")}
            </div>
          </button>
          <button
            onClick={handleScopeAllFuture}
            className="w-full px-4 py-3 text-left rounded-lg border border-red-200 dark:border-red-900 text-[var(--hvsna-danger-color)] hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <div className="font-medium">{t("change_all_future_events")}</div>
            <div className="text-sm opacity-70">
              {t("change_all_future_events_desc")}
            </div>
          </button>
        </div>
      </Modal>
    </>
  );

  const fields = (
    <>
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
        onChange={() => setIsFormDirty(true)}
        onFocus={() => setIsFormFocused(true)}
        onBlur={() => setIsFormFocused(false)}
      />
      <textarea
        name="taskDescription"
        placeholder={t("description")}
        className="text-sm px-4 h-[3rem] py-2 w-[100%] outline-none resize-none"
        defaultValue={task?.description || ""}
        disabled={isSubmitting}
        style={{ resize: "none" }}
        onChange={() => setIsFormDirty(true)}
        onFocus={() => setIsFormFocused(true)}
        onBlur={() => setIsFormFocused(false)}
      />
      <TagInput
        selectedTags={formData.tags}
        onTagsChange={(tags) => {
          updateFormData({ tags });
          setIsFormDirty(true);
        }}
        disabled={isSubmitting}
      />

      <div className="flex flex-wrap gap-2 px-4">
        <DatePrayerInput
          selectedDate={formData.scheduleAt.date as Date}
          isSubmitting={isSubmitting}
          recurringType={formData.repeat.recurringType}
          recurringInterval={formData.repeat.interval}
          recurringEnd={formData.repeat.end}
          recurringEndDate={formData.repeat.endDate}
          recurringEndOccurrences={formData.repeat.endOccurrences}
          useGregorian={formData.repeat.useGregorian}
          onRepeatChange={(
            repeat,
            interval,
            repeatEnd,
            repeatEndDate,
            repeatEndOccurrences,
            useGregorian
          ) => {
            updateRepeatConfig({
              recurringType: repeat,
              interval,
              end: repeatEnd,
              endDate: repeatEndDate,
              endOccurrences: repeatEndOccurrences,
              useGregorian,
            });
            setIsFormDirty(true);
          }}
          onChange={(date) => {
            updateScheduleAt({
              date,
            });
            setIsFormDirty(true);
          }}
        />

        {formData.scheduleAt.date && (
          <TimeInputMobile
            label=""
            name={"atTime"}
            time={formData.scheduleAt.time}
            onChange={function (time: string | null): void {
              updateScheduleAt({
                time: time ?? undefined,
              });
              if (!time) {
                setRemoveTime(true);
              }
              setIsFormDirty(true);
            }}
          />
        )}
      </div>
    </>
  );

  return (
    <form
      className="h-[100%] mb-4 pb-[env(safe-area-inset-bottom)]"
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        await handleSubmit(formData);
      }}
    >
      <ModalNavbar
        title="Edit Task"
        rightAction={
          <div className="flex items-center gap-2">
            {(isFormFocused || isFormDirty) && (
              <NavActionButton
                variant="primary"
                className="shadow-lg z-50"
                aria-label={t("add_new_task")}
                data-testid="task-form-submit"
                type="submit"
              >
                <HvCheck />
              </NavActionButton>
            )}
            {isFormFocused || isFormDirty || menu}
          </div>
        }
      />

      {fields}
      {modals}
    </form>
  );
}
