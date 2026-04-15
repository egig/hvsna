import { useState, useEffect } from "react";
import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation";
import type { TaskRepeat } from "./types";

type RepeatOption =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

interface RepeatSelectorModalProps {
  repeat: TaskRepeat;
  interval: number;
  onBack: () => void;
  onConfirm: (
    repeat: TaskRepeat,
    interval: number,
    repeatEnd: RepeatEnd,
    repeatEndDate: string | null,
    repeatEndOccurrences: number
  ) => void;
  repeatEnd?: RepeatEnd;
  repeatEndDate?: string | null;
  repeatEndOccurrences?: number;
  onSelectEndDate: () => void;
}

const REPEAT_UNITS: { value: TaskRepeat; labelKey: string }[] = [
  { value: "daily", labelKey: "repeat_daily" },
  { value: "weekly", labelKey: "repeat_weekly" },
  { value: "monthly", labelKey: "repeat_monthly" },
  { value: "yearly", labelKey: "repeat_yearly" },
];

const INTERVAL_UNITS: { value: TaskRepeat; labelKey: string }[] = [
  { value: "daily", labelKey: "Days" },
  { value: "weekly", labelKey: "Weeks" },
  { value: "monthly", labelKey: "Months" },
  { value: "yearly", labelKey: "Years" },
];

function isPreset(repeat: TaskRepeat, interval: number): boolean {
  return repeat !== "none" && interval === 1;
}

function getInitialOption(repeat: TaskRepeat, interval: number): RepeatOption {
  if (repeat === "none") return "none";
  if (interval === 1) return repeat;
  return "custom";
}

function formatRepeatEndDate(dateStr: string | null): string {
  if (!dateStr) return "On date";
  // Format YYYYMMDD to a more readable format
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${day}/${month}/${year}`;
}

export function RepeatSelectorModal({
  repeat,
  interval,
  onBack,
  onConfirm,
  repeatEnd: repeatEndProp = "never",
  repeatEndDate = null,
  repeatEndOccurrences: repeatEndOccurrencesProp = 1,
  onSelectEndDate,
}: RepeatSelectorModalProps) {
  const { t } = useLanguageContext();

  const [selectedOption, setSelectedOption] = useState<RepeatOption>(
    getInitialOption(repeat, interval)
  );
  const [customInterval, setCustomInterval] = useState(
    interval > 1 ? interval : 2
  );
  const [customUnit, setCustomUnit] = useState<TaskRepeat>(
    repeat !== "none" ? repeat : "daily"
  );
  const [selectedRepeatEnd, setSelectedRepeatEnd] =
    useState<RepeatEnd>(repeatEndProp);
  const [endOccurrences, setEndOccurrences] = useState(
    repeatEndOccurrencesProp
  );

  // Sync internal state when props change
  useEffect(() => {
    setSelectedRepeatEnd(repeatEndProp);
  }, [repeatEndProp]);

  useEffect(() => {
    setEndOccurrences(repeatEndOccurrencesProp);
  }, [repeatEndOccurrencesProp]);

  const handleConfirm = () => {
    if (selectedOption === "none") {
      onConfirm("none", 1, "never", null, 1);
    } else if (selectedOption === "custom") {
      onConfirm(
        customUnit,
        Math.max(1, customInterval),
        selectedRepeatEnd,
        repeatEndDate ?? null,
        endOccurrences
      );
    } else {
      onConfirm(
        selectedOption as TaskRepeat,
        1,
        selectedRepeatEnd,
        repeatEndDate ?? null,
        endOccurrences
      );
    }
  };

  const handlePresetTap = (option: RepeatOption) => {
    setSelectedOption(option);
    // Only update selection, no immediate confirmation
    if (option === "none") {
      setSelectedRepeatEnd("never");
      setEndOccurrences(1);
    }
  };

  const buttonBase =
    "w-full px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left flex items-center justify-between";
  const activeClass =
    "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]";
  const inactiveClass =
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  return (
    <div className="min-h-[50dvh]">
      <Navbar
        title={t("repeat")}
        modal
        onModalClose={onBack}
        rightAction={
          <NavActionButton variant="primary" onClick={handleConfirm}>
            <HvCheck />
          </NavActionButton>
        }
      />

      <div className="p-4 flex flex-col gap-2">
        {/* Presets */}
        {REPEAT_UNITS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => handlePresetTap(value)}
            className={`${buttonBase} ${
              selectedOption === value ? activeClass : inactiveClass
            }`}
          >
            <span>{t(labelKey)}</span>
            {selectedOption === value && <HvCheck size={16} />}
          </button>
        ))}

        {/* Custom */}
        <button
          type="button"
          onClick={() => setSelectedOption("custom")}
          className={`${buttonBase} ${
            selectedOption === "custom" ? activeClass : inactiveClass
          }`}
        >
          <span>{t("repeat_custom") || "Custom"}</span>
          {selectedOption === "custom" && <HvCheck size={16} />}
        </button>

        {/* Custom interval inputs */}
        {selectedOption === "custom" && (
          <div className="flex gap-2 mt-1 px-1">
            <input
              type="number"
              min={1}
              max={999}
              value={customInterval}
              onChange={(e) =>
                setCustomInterval(Math.max(2, parseInt(e.target.value) || 2))
              }
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as TaskRepeat)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {INTERVAL_UNITS.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ends section */}
        <div
          className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 ${
            selectedOption === "none" ? "opacity-50" : ""
          }`}
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("repeat_ends")}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={selectedOption === "none"}
              onClick={() => {
                if (selectedOption !== "none") {
                  setSelectedRepeatEnd("never");
                }
              }}
              className={`flex-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                selectedRepeatEnd === "never" ? activeClass : inactiveClass
              } ${selectedOption === "none" ? "cursor-not-allowed" : ""}`}
            >
              {t("repeat_ends_never")}
            </button>
            <button
              type="button"
              disabled={selectedOption === "none"}
              onClick={() => {
                if (selectedOption !== "none") {
                  setSelectedRepeatEnd("on_date");
                  onSelectEndDate();
                }
              }}
              className={`flex-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                selectedRepeatEnd === "on_date" ? activeClass : inactiveClass
              } ${selectedOption === "none" ? "cursor-not-allowed" : ""}`}
            >
              {repeatEndDate
                ? formatRepeatEndDate(repeatEndDate)
                : t("repeat_ends_on_date")}
            </button>
            <button
              type="button"
              disabled={selectedOption === "none"}
              onClick={() => {
                if (selectedOption !== "none") {
                  setSelectedRepeatEnd("after_occurrences");
                }
              }}
              className={`flex-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                selectedRepeatEnd === "after_occurrences"
                  ? activeClass
                  : inactiveClass
              } ${selectedOption === "none" ? "cursor-not-allowed" : ""}`}
            >
              {t("repeat_ends_after")}
            </button>
          </div>
          {selectedRepeatEnd === "after_occurrences" && (
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                disabled={selectedOption === "none" || endOccurrences <= 1}
                onClick={() => {
                  if (selectedOption !== "none") {
                    setEndOccurrences(Math.max(1, endOccurrences - 1));
                  }
                }}
                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>

              <div className="w-12 text-center font-medium text-gray-900 dark:text-white">
                {endOccurrences}
              </div>

              <button
                type="button"
                disabled={selectedOption === "none"}
                onClick={() => {
                  if (selectedOption !== "none") {
                    setEndOccurrences(endOccurrences + 1);
                  }
                }}
                className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                {t("occurrences")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Remove repeat */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => handlePresetTap("none")}
          className="w-full px-4 py-3 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
        >
          {t("no_repeat")}
        </button>
      </div>
    </div>
  );
}
