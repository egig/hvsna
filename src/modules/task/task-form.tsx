import { useEffect, useRef } from "react";
import { HvArrowUp } from "@src/modules/icons";
import { DatePrayerInput } from "./date-prayer-input";
import { useHijriDate } from "src/modules/calendar/hijri";
import { useTaskForm } from "./task-form-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useLocation } from "react-router";
import type { Task } from "./types";
import { useSettings } from "src/modules/settings/useSettings";
import { ListSelector } from "./list-selector";
import { useScreenSize } from "../components/screen-size-wrapper";

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
  const { isDesktop } = useScreenSize();
  const {
    error,
    handleSubmit,
    isSubmitting,
    formData,
    updateFormData,
    updateScheduleAt,
    updateRepeatConfig,
    lists,
    listIdPreselected,
  } = useTaskForm(onSuccess, onError, onCancel);
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
      updateScheduleAt({
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
        defaultValue={""}
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
        defaultValue={""}
        disabled={isSubmitting}
        style={{ resize: "none" }}
      />

      <div className="flex flex-wrap gap-3 px-4">
        <DatePrayerInput
          hijriDate={formData.scheduleAt.dateHijri}
          atTime={formData.scheduleAt.time}
          prayerTime={formData.scheduleAt.prayerTime}
          isSubmitting={isSubmitting}
          repeat={formData.repeat.repeat}
          repeatInterval={formData.repeat.interval}
          repeatEnd={formData.repeat.end}
          repeatEndDate={formData.repeat.endDate}
          repeatEndOccurrences={formData.repeat.endOccurrences}
          onRepeatChange={(
            repeat,
            interval,
            repeatEnd,
            repeatEndDate,
            repeatEndOccurrences,
          ) => {
            updateRepeatConfig({
              repeat,
              interval,
              end: repeatEnd,
              endDate: repeatEndDate,
              endOccurrences: repeatEndOccurrences,
            });
          }}
          onChange={(hijriDate, time, prayerTime) => {
            updateScheduleAt({
              dateHijri: hijriDate,
              time,
              prayerTime,
            });
          }}
        />
        {lists.length > 0 && (
          <ListSelector
            lists={lists}
            selectedListId={formData.listId}
            onListChange={(listId) => updateFormData({ listId })}
            disabled={isSubmitting || listIdPreselected}
          />
        )}
      </div>

      <div className="flex justify-end p-4">
        {isDesktop ? (
          <button
            className="px-6 py-2 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md shadow-sm flex items-center justify-center transition-colors"
            aria-label={t("add_new_task")}
            type="submit"
          >
            {t("submit")}
          </button>
        ) : (
          <button
            className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
            aria-label={t("add_new_task")}
            type="submit"
          >
            <HvArrowUp />
          </button>
        )}
      </div>
    </form>
  );
}
