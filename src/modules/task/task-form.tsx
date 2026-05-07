import { useEffect, useRef, useState } from "react";
import { HvArrowUp } from "@/modules/icons";
import { DatePrayerInput } from "./date-prayer-input";
import { useHijriDate } from "src/modules/calendar/hijri";
import { useTaskForm } from "./task-form-hook";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useLocation } from "react-router";
import type { Task } from "./types";
import { useSettings } from "src/modules/settings/useSettings";
import { ProjectSelector } from "./project-selector";
import { useScreenSize } from "../components/screen-size-wrapper";
import { TagInput } from "./tag-input";
import type { InputMode } from "../../domain/tracker/ITrackerRepository";

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
    projects,
    projectIdPreselected,
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

  const inputModeOptions: { value: InputMode; label: string }[] = [
    { value: "toggle", label: t("tracker_type_toggle") || "Yes / No" },
    { value: "add", label: t("tracker_type_add") || "Add amount" },
    { value: "set", label: t("tracker_type_set") || "Record current" },
  ];

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
      {/* Tracker mode toggle */}
      <div className="flex justify-end px-4 py-2">
        <button
          type="button"
          onClick={() => updateFormData({ asTracker: !formData.asTracker })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.asTracker ? "bg-[var(--hvsna-primary-color)]" : "bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label={formData.asTracker ? "Disable tracker mode" : "Enable tracker mode"}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.asTracker ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

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


      {/* Tracker fields - only visible when asTracker is true */}
      {formData.asTracker && (
        <>
          {/* Input mode selector */}
          <div className="px-4 py-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
              {t("tracker_type") || "Type"}
            </label>
            <div className="flex gap-2">
              {inputModeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFormData({ inputMode: opt.value })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.inputMode === opt.value
                      ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unit input */}
          <div className="px-4 py-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_unit") || "Unit (optional)"}
            </label>
            <input
              type="text"
              value={formData.unit || ""}
              onChange={(e) => updateFormData({ unit: e.target.value })}
              placeholder={t("tracker_unit_placeholder") || "e.g. cups, km, minutes..."}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
            />
          </div>

          {/* Target input */}
          <div className="px-4 py-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_target") || "Target (optional)"}
            </label>
            <input
              type="number"
              value={formData.target || ""}
              onChange={(e) => updateFormData({ target: e.target.value })}
              placeholder={t("tracker_target_placeholder") || "e.g. 8, 10000, 30..."}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
            />
          </div>

          {/* Period selector */}
          <div className="px-4 py-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_period") || "Period"}
            </label>
            <select
              value={formData.period || "day"}
              onChange={(e) => updateFormData({ period: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
            >
              <option value="day">{t("period_day") || "Day"}</option>
              <option value="week">{t("period_week") || "Week"}</option>
              <option value="month">{t("period_month") || "Month"}</option>
            </select>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3 px-4">
        {formData.asTracker ? (
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
            forceRepeat={true}
            onRepeatChange={(
              repeat,
              interval,
              repeatEnd,
              repeatEndDate,
              repeatEndOccurrences
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
                time: time ?? undefined,
                prayerTime: prayerTime ?? undefined,
              });
            }}
          />
        ) : (
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
              repeatEndOccurrences
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
                time: time ?? undefined,
                prayerTime: prayerTime ?? undefined,
              });
            }}
          />
        )}
        {projects.length > 0 && (
          <ProjectSelector
            projects={projects}
            selectedProjectId={formData.projectId}
            onProjectChange={(projectId) => updateFormData({ projectId })}
            disabled={isSubmitting || projectIdPreselected}
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
