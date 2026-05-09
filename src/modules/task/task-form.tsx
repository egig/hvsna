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
import type { InputMode } from "../../domain/tracker/types";

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

  const inputModeOptions: {
    value: InputMode;
    label: string;
    description: string;
  }[] = [
    {
      value: "toggle",
      label: t("tracker_type_toggle") || "Yes / No",
      description: t("tracker_type_toggle_desc") || "Did you do it?",
    },
    {
      value: "add",
      label: t("tracker_type_add") || "Add",
      description: t("tracker_type_add_desc") || "Log a quantity",
    },
    {
      value: "set",
      label: t("tracker_type_set") || "Record",
      description: t("tracker_type_set_desc") || "Set current value",
    },
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
          hijriDate={formData.scheduleAt.dateHijri}
          atTime={formData.scheduleAt.time}
          prayerTime={formData.scheduleAt.prayerTime}
          isSubmitting={isSubmitting}
          repeat={formData.repeat.repeat}
          repeatInterval={formData.repeat.interval}
          repeatEnd={formData.repeat.end}
          repeatEndDate={formData.repeat.endDate}
          repeatEndOccurrences={formData.repeat.endOccurrences}
          forceRepeat={!!formData.inputMode}
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
        {projects.length > 0 && (
          <ProjectSelector
            projects={projects}
            selectedProjectId={formData.projectId}
            onProjectChange={(projectId) => updateFormData({ projectId })}
            disabled={isSubmitting || projectIdPreselected}
          />
        )}
      </div>

      {/* Tracker section - only visible when repeat is selected */}
      {formData.repeat.repeat !== "none" && (
        <div className="mx-4 my-1 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header row — single toggle for the whole tracker */}
          <button
            type="button"
            onClick={() => {
              if (formData.inputMode) {
                updateFormData({
                  inputMode: undefined,
                  unit: undefined,
                  showGoalSettings: false,
                  goalTarget: undefined,
                  goalPeriod: undefined,
                });
              } else {
                updateFormData({ inputMode: "toggle" });
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-left"
            aria-label={
              formData.inputMode ? "Disable tracker" : "Enable tracker"
            }
          >
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("track") || "Track this habit"}
              </span>
              {!formData.inputMode && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("track_description") || "Log progress on each occurrence"}
                </p>
              )}
            </div>
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                formData.inputMode
                  ? "bg-[var(--hvsna-primary-color)]"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  formData.inputMode ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>

          {/* Expanded tracker settings */}
          {formData.inputMode && (
            <div className="px-4 py-3 space-y-4 border-t border-gray-100 dark:border-gray-800">
              {/* How to log */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t("tracker_type") || "How to log?"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {inputModeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFormData({ inputMode: opt.value })}
                      className={`py-3 px-2 rounded-lg border text-center transition-colors ${
                        formData.inputMode === opt.value
                          ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit — inline label + input */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-8 shrink-0">
                  {t("tracker_unit") || "Unit"}
                </span>
                <input
                  type="text"
                  value={formData.unit || ""}
                  onChange={(e) => updateFormData({ unit: e.target.value })}
                  placeholder={
                    t("tracker_unit_placeholder") || "cups, km, pages…"
                  }
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
                />
              </div>

              {/* Goal — checkbox + inline target/period */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={formData.showGoalSettings}
                    onChange={(e) =>
                      updateFormData({ showGoalSettings: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-[var(--hvsna-primary-color)] focus:ring-[var(--hvsna-primary-color)]"
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("set_goal") || "Set a target"}
                  </span>
                </label>

                {formData.showGoalSettings && (
                  <div className="flex items-center gap-2 mt-2 pl-5">
                    <input
                      type="number"
                      value={formData.goalTarget || ""}
                      onChange={(e) =>
                        updateFormData({ goalTarget: e.target.value })
                      }
                      placeholder={t("tracker_target_placeholder") || "e.g. 8"}
                      disabled={isSubmitting}
                      className="w-20 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
                    />
                    <span className="text-xs text-gray-400">
                      {t("per") || "per"}
                    </span>
                    <select
                      value={formData.goalPeriod || "day"}
                      onChange={(e) =>
                        updateFormData({ goalPeriod: e.target.value })
                      }
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
                    >
                      <option value="day">{t("period_day") || "Day"}</option>
                      <option value="week">{t("period_week") || "Week"}</option>
                      <option value="month">
                        {t("period_month") || "Month"}
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
