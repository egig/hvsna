import { useEffect, useRef, useState } from "react";
import {
  HvArrowUp,
  HvTrash2,
  HvEye,
  HvInfo,
  HvMoreVertical,
} from "@src/modules/icons";
import { Menu } from "@base-ui/react/menu";
import { DatePrayerInput } from "./date-prayer-input";
import { useTaskFormEdit } from "./task-form-edit-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation";
import type { Task } from "./types";
import { useFeatureFlag } from "../feature-flags/useFeatureFlags";
import type { HijriDate } from "../calendar/hijri";
import { Modal } from "../navigation/modal";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import TaskPreview from "./task-preview";
import { ListSelector } from "./list-selector";

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
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { toHijriDate, formatDate } = useHijriDate();
  const {
    error,
    task,
    handleSubmit,
    handleDelete,
    handleDeleteSingle,
    handleDeleteAll,
    showDeleteOptions,
    setShowDeleteOptions,
    isSubmitting,
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
  } = useTaskFormEdit(taskId, onSuccess, onError, onCancel, onDelete);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <form
      className="h-[100%] mb-4 pb-[env(safe-area-inset-bottom)]"
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
          <div className="flex items-center gap-2">
            {(isFormFocused || isFormDirty) && (
              <button
                className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                aria-label={t("add_new_task")}
                type="submit"
              >
                <HvArrowUp />
              </button>
            )}

            {isFormFocused || isFormDirty || (
              <Menu.Root>
                <Menu.Trigger
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-colors z-50"
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
                        // closeOnClick={true}
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
            )}
          </div>
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

      <div className="flex flex-wrap gap-3 px-4">
        <DatePrayerInput
          hijriDate={selectedScheduleAt.dateHijri as HijriDate}
          atTime={selectedScheduleAt.time || ""}
          prayerTime={selectedScheduleAt.prayerTime || ""}
          isSubmitting={isSubmitting}
          repeat={selectedRepeat}
          repeatInterval={selectedRepeatInterval}
          onRepeatChange={(repeat, interval) => {
            setSelectedRepeat(repeat);
            setSelectedRepeatInterval(interval);
            setIsFormDirty(true);
          }}
          onChange={(hijriDate, time, prayerTime) => {
            setSelectedScheduleAt({
              dateHijri: hijriDate,
              time: time,
              prayerTime: prayerTime,
            });
            setIsFormDirty(true);
            if (!time && !prayerTime) {
              setRemoveTime(true);
            }
          }}
        />
        {lists.length > 0 && (
          <ListSelector
            lists={lists}
            selectedListId={selectedListId}
            onListChange={(listId) => {
              setIsFormDirty(true);
              setSelectedListId(listId);
            }}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={t("task_details")}
      >
        {task && <TaskPreview task={task} />}
      </Modal>

      {/* Delete options modal for recurring tasks */}
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
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("delete_this_task_desc")}</div>
          </button>
          <button
            onClick={handleDeleteAll}
            className="w-full px-4 py-3 text-left rounded-lg border border-red-200 dark:border-red-900 text-[var(--hvsna-danger-color)] hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <div className="font-medium">{t("delete_all_recurring")}</div>
            <div className="text-sm opacity-70">{t("delete_all_recurring_desc")}</div>
          </button>
        </div>
      </Modal>
    </form>
  );
}
