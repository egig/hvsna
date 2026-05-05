import { useState, useEffect } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import type {
  TrackerType,
  TrackerFrequency,
  HabitCondition,
} from "../../domain/tracker/ITrackerRepository";
import { HvX, HvRepeat, HvArrowUp, type HvIcon } from "../icons";
import { HijriDateInput } from "../calendar/hijri-date-input";
import { HijriDate } from "../calendar/hijri";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";

interface TrackerFormProps {
  editingId?: string | null;
  onClose: () => void;
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

const TYPE_META: {
  value: TrackerType;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  icon: HvIcon;
}[] = [
  {
    value: "habit",
    labelKey: "tracker_habit",
    labelFallback: "Habit",
    descKey: "tracker_habit_desc",
    descFallback: "Build a daily habit",
    icon: HvRepeat,
  },
  {
    value: "build_up",
    labelKey: "tracker_build_up",
    labelFallback: "Accumulate",
    descKey: "tracker_build_up_desc",
    descFallback: "Track progress toward a goal",
    icon: HvArrowUp,
  },
];

export function TrackerForm({ editingId, onClose }: TrackerFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers, createTracker, updateTracker } = useTrackers();

  const existing = editingId
    ? trackers?.find((tr) => tr.id === editingId)
    : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<TrackerType>(existing?.type ?? "habit");
  const [direction, setDirection] = useState<"up" | "down">(
    existing?.direction ?? "up"
  );
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [period, setPeriod] = useState<TrackerFrequency | undefined>(
    existing?.period
  );
  const [condition, setCondition] = useState<HabitCondition>(
    existing?.condition ?? "binary"
  );
  const [startingValue, setStartingValue] = useState(
    existing?.startingValue?.toString() ?? ""
  );
  const [targetValue, setTargetValue] = useState(
    existing?.targetValue?.toString() ?? ""
  );
  const [targetMin, setTargetMin] = useState(
    existing?.targetMin?.toString() ?? ""
  );
  const [targetMax, setTargetMax] = useState(
    existing?.targetMax?.toString() ?? ""
  );
  const [endDateHijri, setEndDateHijri] = useState(
    existing?.endDateHijri ?? ""
  );
  const [accumulate, setAccumulate] = useState(existing?.accumulate ?? true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [startingValueError, setStartingValueError] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setType(existing.type ?? "habit");
      setDirection(
        existing.direction ?? (existing.type === "cut_down" ? "down" : "up")
      );
      setUnit(existing.unit ?? "");
      setPeriod(existing.period);
      setCondition(existing.condition ?? "binary");
      setStartingValue(existing.startingValue?.toString() ?? "");
      setTargetValue(existing.targetValue?.toString() ?? "");
      setTargetMin(existing.targetMin?.toString() ?? "");
      setTargetMax(existing.targetMax?.toString() ?? "");
      setEndDateHijri(existing.endDateHijri ?? "");
      setAccumulate(existing.accumulate ?? true);
    }
  }, [editingId]);

  const selectedMeta = TYPE_META.find((m) => m.value === type)!;

  const handleSave = async (trimmedName?: string) => {
    const trimmed = trimmedName ?? name.trim();
    if (!trimmed) {
      setNameError(t("tracker_name_required") || "Name is required");
      return;
    }
    const startVal = startingValue ? parseFloat(startingValue) : undefined;
    const tgtVal = targetValue ? parseFloat(targetValue) : undefined;
    if (
      (type === "cut_down" ||
        ((type === "build_up" || type === "habit") &&
          condition === "threshold")) &&
      startVal !== undefined &&
      tgtVal !== undefined
    ) {
      if (direction === "up" && startVal >= tgtVal) {
        setStartingValueError(
          t("tracker_starting_value_error_up") ||
            "Starting value must be less than target"
        );
        return;
      }
      if (direction === "down" && startVal <= tgtVal) {
        setStartingValueError(
          t("tracker_starting_value_error_down") ||
            "Starting value must be greater than target"
        );
        return;
      }
    }
    setStartingValueError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        type: type === "cut_down" ? ("build_up" as const) : type,
        unit: unit.trim() || undefined,
        period: period,
        direction:
          type === "cut_down" ||
          ((type === "build_up" || type === "habit") &&
            condition === "threshold")
            ? direction
            : undefined,
        condition:
          type === "habit" || type === "build_up" ? condition : undefined,
        startingValue:
          (type === "cut_down" ||
            ((type === "build_up" || type === "habit") &&
              condition === "threshold")) &&
          startVal !== undefined
            ? startVal
            : undefined,
        targetValue:
          (type === "habit" || type === "build_up") &&
          condition === "threshold" &&
          tgtVal !== undefined
            ? tgtVal
            : undefined,
        targetMin:
          (type === "habit" || type === "build_up") &&
          condition === "range" &&
          targetMin
            ? parseFloat(targetMin)
            : undefined,
        targetMax:
          (type === "habit" || type === "build_up") &&
          condition === "range" &&
          targetMax
            ? parseFloat(targetMax)
            : undefined,
        endDateHijri: endDateHijri.trim() ? endDateHijri.trim() : undefined,
        accumulate,
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

  const periodOptions: { value: TrackerFrequency; label: string }[] = [
    { value: "daily", label: t("period_daily") || "Daily" },
    { value: "weekly", label: t("period_weekly") || "Weekly" },
    { value: "monthly", label: t("period_monthly") || "Monthly" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {editingId
            ? t("edit_tracker") || "Edit Tracker"
            : t("new_tracker") || "New Tracker"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <HvX size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
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
                className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  type === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <opt.icon
                    size={18}
                    className={
                      type === opt.value
                        ? "text-[var(--hvsna-primary-color)] shrink-0"
                        : "text-gray-400 dark:text-gray-500 shrink-0"
                    }
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                    {t(opt.labelKey as Parameters<typeof t>[0]) ||
                      opt.labelFallback}
                  </span>
                </div>
                <p className="text-[11px] leading-tight text-gray-500 dark:text-gray-400 pl-[26px]">
                  {t(opt.descKey as Parameters<typeof t>[0]) ||
                    opt.descFallback}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("tracker_name") || "Name"}
          </label>
          <TextInput
            value={name}
            onChange={(v) => {
              setName(v);
              setNameError(null);
            }}
            placeholder={
              t("tracker_name_placeholder") || "e.g. Water intake, Exercise..."
            }
            autoFocus={!editingId}
          />
          {nameError && (
            <p className="mt-1.5 text-xs text-[var(--hvsna-danger-color)]">
              {nameError}
            </p>
          )}
        </div>

        {/* Condition — for habit and build_up */}
        {(type === "habit" || type === "build_up") && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t("tracker_condition") || "Condition"}
            </p>
            <div className="flex gap-2">
              {(type === "habit"
                ? ([
                    ["binary", t("condition_binary") || "Binary"],
                    ["threshold", t("condition_threshold") || "Threshold"],
                    ["range", t("condition_range") || "Range"],
                  ] as const)
                : ([
                    ["threshold", t("condition_threshold") || "Threshold"],
                    ["range", t("condition_range") || "Range"],
                  ] as const)
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCondition(val)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    condition === val
                      ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direction — only for threshold condition */}
        {(type === "build_up" || type === "habit") &&
          condition === "threshold" && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Direction
              </p>
              <div className="flex gap-2">
                {(
                  [
                    ["up", "↑ Build up"],
                    ["down", "↓ Cut down"],
                  ] as const
                ).map(([dir, label]) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setDirection(dir)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      direction === dir
                        ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Unit */}
        {condition !== "binary" && (
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
              {t("tracker_unit") || "Unit (optional)"}
            </label>
            <TextInput
              value={unit}
              onChange={setUnit}
              placeholder={
                t("tracker_unit_placeholder") || "e.g. cups, km, minutes..."
              }
            />
          </div>
        )}

        {/* Starting value — only for threshold condition */}
        <div className="flex gap-2">
          {(type === "build_up" || type === "habit") &&
            condition === "threshold" && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                  {t("tracker_starting_value") || "Starting value"}{" "}
                  {unit ? `(${unit})` : ""}
                </label>
                <TextInput
                  type="number"
                  value={startingValue}
                  onChange={(v) => {
                    setStartingValue(v);
                    setStartingValueError(null);
                  }}
                  placeholder="e.g. 0"
                />
                {startingValueError && (
                  <p className="mt-1.5 text-xs text-[var(--hvsna-danger-color)]">
                    {startingValueError}
                  </p>
                )}
              </div>
            )}

          {/* Target value */}
          {(type === "habit" || type === "build_up") &&
            condition === "threshold" && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                  {t("tracker_target_value") || "Target"}{" "}
                  {unit ? `(${unit})` : ""}
                </label>
                <TextInput
                  type="number"
                  value={targetValue}
                  onChange={setTargetValue}
                  placeholder="e.g. 10000"
                />
              </div>
            )}
        </div>

        {/* Range bounds */}
        {(type === "habit" || type === "build_up") && condition === "range" && (
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

        {/* Period */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("tracker_period") || "Period"}{" "}
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              ({t("optional") || "optional"})
            </span>
          </p>
          <div className="flex gap-2">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setPeriod(period === opt.value ? undefined : opt.value)
                }
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  period === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {condition !== "binary" && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accumulate}
                onChange={(e) => setAccumulate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--hvsna-primary-color)] focus:ring-[var(--hvsna-primary-color)]"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("tracker_accumulate") || "Accumulate logs"}
              </span>
            </label>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 pl-6">
              {t("tracker_accumulate_help") ||
                "Log will be accumulated instead of replace previous value"}
            </p>
          </div>
        )}

        {/* End date (deadline) */}
        {type !== "habit" && (
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
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </div>
  );
}
