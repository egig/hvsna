import { useEffect } from "react";
import { HvArrowUp } from "@/modules/icons";
import { DatePrayerInput } from "@/modules/task/date-prayer-input";
import { TitleTagInput } from "@/modules/task/title-tag-input";
import { useTitleTagField } from "@/modules/task/use-title-tag-field";
import { useTaskForm } from "@/modules/task/task-form-hook";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { usePageContext } from "@/modules/task/use-page-context";
import type { Task } from "@/domain/task";
import dayjs from "dayjs";
import TimeInputMobile from "./time-input";
import { TagInput } from "./tag-input";

interface TaskFormProps {
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskFormMobile({ onSuccess, onError }: TaskFormProps) {
  const { t } = useLanguageContext();
  const {
    error,
    handleSubmit,
    isSubmitting,
    formData,
    updateFormData,
    updateScheduleAt,
    updateRepeatConfig,
  } = useTaskForm(onSuccess, onError);
  const { page, params } = usePageContext();

  const titleField = useTitleTagField({
    seedText: "",
    seedTags: formData.tags,
    onEffectiveTagsChange: (tags) => updateFormData({ tags }),
  });

  // Date prefill
  useEffect(() => {
    if (page === "today" || page === "upcoming") {
      updateScheduleAt({
        date: dayjs().endOf("day").toDate(),
        time: "",
      });
    }
  }, []);

  // Tag prefill
  useEffect(() => {
    if (page === "tag" && params.tagName) {
      titleField.setPickerTags([params.tagName]);
    }
  }, []);

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
      <TitleTagInput
        state={titleField.state}
        onStateChange={titleField.onStateChange}
        placeholder={t("task_name")}
        ariaLabel={t("task_name")}
        disabled={isSubmitting}
        autoFocus
      />
      <textarea
        name="taskDescription"
        placeholder={t("description")}
        className="text-sm px-4 h-[3rem] py-2 w-[100%] outline-none resize-none"
        defaultValue={""}
        disabled={isSubmitting}
        style={{ resize: "none" }}
      />

      <div className="flex flex-wrap gap-2 px-4 py-2">
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
          <TimeInputMobile
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
        <TagInput
          selectedTags={formData.tags}
          onTagsChange={titleField.setPickerTags}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end p-4">
        <button
          className="w-12 h-12 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label={t("add_new_task")}
          data-testid="task-form-submit"
          type="submit"
        >
          <HvArrowUp />
        </button>
      </div>
    </form>
  );
}
