import { useEffect, useRef, useState } from "react";
import { ArrowUp, Trash2, Eye, Info } from "lucide-react";
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
    isSubmitting,
    setRemoveTime,
    selectedScheduleAt,
    setSelectedScheduleAt,
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

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowDetailsModal(true)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
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
        {task && <TaskPreview task={task} />}
      </Modal>
    </form>
  );
}
