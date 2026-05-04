import React, { useState, useEffect } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import type { TrackerType, TrackerFrequency } from "../../domain/tracker/ITrackerRepository";
import {
  HvX,
  HvRepeat,
  HvArrowUp,
  HvArrowDown,
  HvTarget,
  HvScale,
  HvChevronLeft,
  type HvIcon,
} from "../icons";

interface TrackerFormProps {
  editingId?: string | null;
  onClose: () => void;
}

const GOAL_TYPES: TrackerType[] = ["habit", "build_up", "cut_down", "target", "range"];
const NEEDS_TARGET: TrackerType[] = ["build_up", "cut_down", "target"];
const NEEDS_RANGE: TrackerType[] = ["range"];
const NEEDS_UNIT: TrackerType[] = ["build_up", "cut_down", "target", "range"];

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

const TYPE_META: {
  value: TrackerType;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  icon: HvIcon;
}[] = [
  { value: "habit", labelKey: "tracker_habit", labelFallback: "Habit", descKey: "tracker_habit_desc", descFallback: "Build a daily habit", icon: HvRepeat },
  { value: "build_up", labelKey: "tracker_build_up", labelFallback: "Build Up", descKey: "tracker_build_up_desc", descFallback: "Accumulate toward a goal", icon: HvArrowUp },
  { value: "cut_down", labelKey: "tracker_cut_down", labelFallback: "Cut Down", descKey: "tracker_cut_down_desc", descFallback: "Reduce toward a target", icon: HvArrowDown },
  { value: "target", labelKey: "tracker_target", labelFallback: "Target", descKey: "tracker_target_desc", descFallback: "Reach a specific value", icon: HvTarget },
  { value: "range", labelKey: "tracker_range", labelFallback: "Range", descKey: "tracker_range_desc", descFallback: "Stay within bounds", icon: HvScale },
];

export function TrackerForm({ editingId, onClose }: TrackerFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers, createTracker, updateTracker } = useTrackers();

  const existing = editingId ? trackers?.find((tr) => tr.id === editingId) : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<TrackerType>(existing?.type ?? "habit");
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [frequency, setFrequency] = useState<TrackerFrequency>(existing?.frequency ?? "daily");
  const [targetValue, setTargetValue] = useState(existing?.targetValue?.toString() ?? "");
  const [targetMin, setTargetMin] = useState(existing?.targetMin?.toString() ?? "");
  const [targetMax, setTargetMax] = useState(existing?.targetMax?.toString() ?? "");
  const [endDateHijri, setEndDateHijri] = useState(existing?.endDateHijri ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
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

  const isGoalType = GOAL_TYPES.includes(type);
  const hasStep2 = isGoalType || NEEDS_UNIT.includes(type);
  const selectedMeta = TYPE_META.find((m) => m.value === type)!;

  const handleNext = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("tracker_name_required") || "Name is required");
      return;
    }
    setNameError(null);
    if (hasStep2) {
      setStep(2);
    } else {
      void handleSave(trimmed);
    }
  };

  const handleSave = async (trimmedName?: string) => {
    const trimmed = trimmedName ?? name.trim();
    if (!trimmed) {
      setNameError(t("tracker_name_required") || "Name is required");
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
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

  const frequencyOptions: { value: TrackerFrequency; label: string }[] = [
    { value: "daily", label: t("freq_daily") || "Daily" },
    { value: "weekly", label: t("freq_weekly") || "Weekly" },
    { value: "monthly", label: t("freq_monthly") || "Monthly" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <HvChevronLeft size={18} />
            </button>
          )}
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {editingId ? t("edit_tracker") || "Edit Tracker" : t("new_tracker") || "New Tracker"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {step}/{hasStep2 ? 2 : 1}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <HvX size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {step === 1 ? (
          <>
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                {t("tracker_name") || "Name"}
              </label>
              <TextInput
                value={name}
                onChange={(v) => { setName(v); setNameError(null); }}
                placeholder={t("tracker_name_placeholder") || "e.g. Water intake, Exercise..."}
                autoFocus={!editingId}
              />
              {nameError && <p className="mt-1.5 text-xs text-[var(--hvsna-danger-color)]">{nameError}</p>}
            </div>

            {/* Type — compact 2-col grid */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {t("tracker_type") || "Type"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_META.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      type === opt.value
                        ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <opt.icon
                      size={18}
                      className={
                        type === opt.value
                          ? "text-[var(--hvsna-primary-color)] shrink-0"
                          : "text-gray-400 dark:text-gray-500 shrink-0"
                      }
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                      {t(selectedMeta.labelKey as Parameters<typeof t>[0]) && opt.value === type
                        ? t(opt.labelKey as Parameters<typeof t>[0]) || opt.labelFallback
                        : t(opt.labelKey as Parameters<typeof t>[0]) || opt.labelFallback}
                    </span>
                  </button>
                ))}
              </div>
              {/* Description of selected type */}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 px-1">
                {t(selectedMeta.descKey as Parameters<typeof t>[0]) || selectedMeta.descFallback}
              </p>
            </div>
          </>
        ) : (
          <>
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
                  autoFocus
                />
              </div>
            )}

            {isGoalType && (
              <>
                {/* Frequency */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t("tracker_frequency") || "Frequency"}
                  </p>
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
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        {step === 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium transition-opacity"
          >
            {hasStep2 ? t("next") || "Next" : t("save") || "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            {submitting ? "..." : t("save") || "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
