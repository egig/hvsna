import { useEffect, useRef, useState } from "react";
import { ArrowUp, Trash2, Eye, Info, MoreVertical } from "lucide-react";
import { DatePrayerInput } from "./date-prayer-input";
import { useTaskFormEdit } from "./task-form-edit-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation";
import type { Task } from "./types";
import { useFeatureFlag } from "../feature-flags/useFeatureFlags";
import type { HijriDate } from "../calendar/hijri";
import { Modal } from "../navigation/modal";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { Menu } from "@base-ui/react/menu";
import TaskPreview from "./task-preview";

interface TaskFormEditProps {
  taskId: string;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskFormEditDesktop({
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
    isSubmitting,
    setRemoveTime,
    selectedScheduleAt,
    setSelectedScheduleAt,
    selectedListId,
    setSelectedListId,
    lists,
  } = useTaskFormEdit(taskId, onSuccess, onError, onCancel, onDelete);

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

  return (
    <form
      className="h-[100%]"
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        await handleSubmit(formData);
      }}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t("edit_task")}
        </h2>
        <div className="flex items-center gap-2">
          <Menu.Root>
            <Menu.Trigger
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center transition-colors"
              aria-label={t("more_options")}
            >
              <MoreVertical size={18} />
            </Menu.Trigger>

            <Menu.Portal>
              <Menu.Positioner className="z-[9999]">
                <Menu.Popup className="z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
                  <Menu.Item
                    onClick={() => setShowDetailsModal(true)}
                    disabled={isSubmitting}
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                  >
                    <Info size={18} />
                    {t("view_details")}
                  </Menu.Item>
                  <Menu.Item
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-3 text-left hover:text-[var(--hvsna-danger-color-hover)] text-[var(--hvsna-danger-color)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                  >
                    <Trash2 size={18} />
                    {t("delete_task")}
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
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

      <div className="flex flex-wrap gap-3 px-4">
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
        {lists.length > 0 && (
          <div className="w-fit">
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("no_list")}</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end p-4">
        <button
          className="px-6 py-2 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md shadow-sm flex items-center justify-center transition-colors"
          aria-label={t("add_new_task")}
          type="submit"
        >
          {t("submit")}
        </button>
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={t("task_details")}
      >
        {task && <TaskPreview task={task} />}
      </Modal>
    </form>
  );
}
