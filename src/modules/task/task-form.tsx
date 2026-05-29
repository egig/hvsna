import { useEffect, useRef } from "react";
import { HvArrowUp } from "@/modules/icons";
import { DatePrayerInput } from "./date-prayer-input";
import { useTaskForm } from "./task-form-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useLocation } from "react-router";
import type { Task } from "@/domain/task";
import { useScreenSize } from "../components/screen-size-wrapper";
import { TagInput } from "./tag-input";
import { TimeInput } from "../calendar/time-input";

interface TaskFormProps {
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskForm({ onSuccess, onError }: TaskFormProps) {
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
  } = useTaskForm(onSuccess, onError);
  const location = useLocation();

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focus the name input when the form opens
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (["/today", "/upcoming"].includes(location.pathname)) {
      updateScheduleAt({
        date: new Date(),
        time: "",
      });
    }
  }, [location.state]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <form
      className="h-full overflow-y-auto"
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

      <TagInput
        selectedTags={formData.tags}
        onTagsChange={(tags) => updateFormData({ tags })}
        disabled={isSubmitting}
      />

      <div className="flex flex-wrap gap-3 px-4 py-2">
        <DatePrayerInput
          selectedDate={formData.scheduleAt.date}
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
          }}
          onChange={(d) => {
            updateScheduleAt({
              date: d,
            });
          }}
        />
        {formData.scheduleAt.date && (
          <TimeInput
            label=""
            name={"atTime"}
            time={formData.scheduleAt.time}
            onChange={function (time: string | null): void {
              updateScheduleAt({
                time: time ?? undefined,
              });
            }}
          />
        )}
      </div>

      <div className="flex justify-end p-4">
        {isDesktop ? (
          <button
            className="px-6 py-2 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md shadow-sm flex items-center justify-center transition-colors"
            aria-label={t("add_new_task")}
            data-testid="task-form-submit"
            type="submit"
          >
            {t("submit")}
          </button>
        ) : (
          <button
            className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
            aria-label={t("add_new_task")}
            data-testid="task-form-submit"
            type="submit"
          >
            <HvArrowUp />
          </button>
        )}
      </div>
    </form>
  );
}
