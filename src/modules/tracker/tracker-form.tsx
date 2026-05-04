import React, { useState, useEffect } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import type { TrackerType, TrackerFrequency } from "../../domain/tracker/ITrackerRepository";
import { HvX } from "../icons";

interface TrackerFormProps {
  editingId?: string | null;
  onClose: () => void;
}

const GOAL_TYPES: TrackerType[] = ["habit", "build_up", "cut_down", "target", "range"];
const NEEDS_TARGET: TrackerType[] = ["build_up", "cut_down", "target"];
const NEEDS_RANGE: TrackerType[] = ["range"];
const NEEDS_UNIT: TrackerType[] = ["build_up", "cut_down", "target", "range"];

function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{children}</p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
    />
  );
}

export function TrackerForm({ editingId, onClose }: TrackerFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers, createTracker, updateTracker } = useTrackers();

  const existing = editingId ? trackers?.find((tr) => tr.id === editingId) : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<TrackerType>(existing?.type ?? "habit");
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [frequency, setFrequency] = useState<TrackerFrequency>(existing?.frequency ?? "daily");
  const [targetValue, setTargetValue] = useState(existing?.targetValue?.toString() ?? "");
  const [targetMin, setTargetMin] = useState(existing?.targetMin?.toString() ?? "");
  const [targetMax, setTargetMax] = useState(existing?.targetMax?.toString() ?? "");
  const [endDateHijri, setEndDateHijri] = useState(existing?.endDateHijri ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setType(existing.type ?? "habit");
      setUnit(existing.unit ?? "");
      setFrequency(existing.frequency ?? "daily");
      setTargetValue(existing.targetValue?.toString() ?? "");
      setTargetMin(existing.targetMin?.toString() ?? "");
      setTargetMax(existing.targetMax?.toString() ?? "");
      setEndDateHijri(existing.endDateHijri ?? "");
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("tracker_name_required") || "Name is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const isGoalType = GOAL_TYPES.includes(type);
      const payload = {
        name: trimmed,
        type,
        unit: unit.trim() || undefined,
        frequency: isGoalType ? frequency : undefined,
        targetValue: NEEDS_TARGET.includes(type) && targetValue ? parseFloat(targetValue) : undefined,
        targetMin: NEEDS_RANGE.includes(type) && targetMin ? parseFloat(targetMin) : undefined,
        targetMax: NEEDS_RANGE.includes(type) && targetMax ? parseFloat(targetMax) : undefined,
        endDateHijri: isGoalType && endDateHijri.trim() ? endDateHijri.trim() : undefined,
      };
      if (editingId) {
        await updateTracker(editingId, payload);
      } else {
        await createTracker(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: { value: TrackerType; label: string; desc: string }[] = [
    { value: "habit", label: t("tracker_habit") || "Habit", desc: t("tracker_habit_desc") || "Build a daily habit" },
    { value: "build_up", label: t("tracker_build_up") || "Build Up", desc: t("tracker_build_up_desc") || "Accumulate toward a goal" },
    { value: "cut_down", label: t("tracker_cut_down") || "Cut Down", desc: t("tracker_cut_down_desc") || "Reduce toward a target" },
    { value: "target", label: t("tracker_target") || "Target", desc: t("tracker_target_desc") || "Reach a specific value" },
    { value: "range", label: t("tracker_range") || "Range", desc: t("tracker_range_desc") || "Stay within bounds" },
  ];

  const frequencyOptions: { value: TrackerFrequency; label: string }[] = [
    { value: "daily", label: t("freq_daily") || "Daily" },
    { value: "weekly", label: t("freq_weekly") || "Weekly" },
    { value: "monthly", label: t("freq_monthly") || "Monthly" },
  ];

  const isGoalType = GOAL_TYPES.includes(type);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {editingId ? t("edit_tracker") || "Edit Tracker" : t("new_tracker") || "New Tracker"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <HvX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {error && <p className="text-sm text-[var(--hvsna-danger-color)]">{error}</p>}

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("tracker_name") || "Name"}
          </label>
          <TextInput
            value={name}
            onChange={setName}
            placeholder={t("tracker_name_placeholder") || "e.g. Water intake, Exercise..."}
            autoFocus={!editingId}
          />
        </div>

        {/* Type */}
        <div>
          <LabelText>{t("tracker_type") || "Type"}</LabelText>
          <div className="space-y-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  type === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Unit */}
        {NEEDS_UNIT.includes(type) && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_unit") || "Unit (optional)"}
            </label>
            <TextInput
              value={unit}
              onChange={setUnit}
              placeholder={t("tracker_unit_placeholder") || "e.g. cups, km, minutes..."}
            />
          </div>
        )}

        {/* Goal fields for goal types */}
        {isGoalType && (
          <>
            {/* Frequency */}
            <div>
              <LabelText>{t("tracker_frequency") || "Frequency"}</LabelText>
              <div className="flex gap-2">
                {frequencyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      frequency === opt.value
                        ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target value */}
            {NEEDS_TARGET.includes(type) && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                  {t("tracker_target_value") || "Target"} {unit ? `(${unit})` : ""}
                </label>
                <TextInput
                  type="number"
                  value={targetValue}
                  onChange={setTargetValue}
                  placeholder="e.g. 10000"
                />
              </div>
            )}

            {/* Range bounds */}
            {NEEDS_RANGE.includes(type) && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                    {t("tracker_target_min") || "Min"} {unit ? `(${unit})` : ""}
                  </label>
                  <TextInput
                    type="number"
                    value={targetMin}
                    onChange={setTargetMin}
                    placeholder="e.g. 6"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                    {t("tracker_target_max") || "Max"} {unit ? `(${unit})` : ""}
                  </label>
                  <TextInput
                    type="number"
                    value={targetMax}
                    onChange={setTargetMax}
                    placeholder="e.g. 8"
                  />
                </div>
              </div>
            )}

            {/* End date (deadline) */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                {t("tracker_end_date") || "Deadline (optional, YYYYMMDD Hijri)"}
              </label>
              <TextInput
                value={endDateHijri}
                onChange={setEndDateHijri}
                placeholder="e.g. 14470101"
              />
            </div>
          </>
        )}

      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </form>
  );
}
