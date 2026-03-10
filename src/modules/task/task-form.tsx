import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { FormInput } from "src/ui/form-input";
import { DatePrayerInput } from "./date-prayer-input";
import { HijriDate, useHijriDate } from "src/modules/calendar/hijri";
import { useTaskForm } from "./task-form-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useLocation } from "react-router";
import type { PrayerTime, Task } from "./types";
import { useFeatureFlag } from "../feature-flags/useFeatureFlags";
import { useSettings } from "src/modules/settings/useSettings";

interface TaskFormProps {
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskForm({
  onSuccess,
  onError,
  onCancel,
  onDelete,
}: TaskFormProps) {
  const { t } = useLanguageContext();
  const {
    error,
    task,
    handleSubmit,
    isSubmitting,
    selectedScheduleAt,
    setSelectedScheduleAt,
    selectedListId,
    setSelectedListId,
    lists,
  } = useTaskForm(onSuccess, onError, onCancel);
  const goalEnabled = useFeatureFlag("TASK_GOAL");
  const location = useLocation();
  const { settings } = useSettings();
  const offset = settings.manualDateOffset || 0;
  const { getToday } = useHijriDate();

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focus the name input when the form opens
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (["today", "upcoming"].includes(location.state?.context)) {
      setSelectedScheduleAt({
        dateHijri: getToday(),
        time: "",
        prayerTime: "",
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Helper function to render attribute input using CustomAttributeInput

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

      <DatePrayerInput
        hijriDate={selectedScheduleAt.dateHijri}
        atTime={selectedScheduleAt.time}
        prayerTime={selectedScheduleAt.prayerTime}
        isSubmitting={isSubmitting}
        onChange={(hijriDate, time, prayerTime) => {
          setSelectedScheduleAt({
            dateHijri: hijriDate,
            time,
            prayerTime,
          });
        }}
      />

      {/* List Selection */}
      {lists.length > 0 && (
        <div className="px-4 py-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("list") || "List"}
          </label>
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No list</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
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
