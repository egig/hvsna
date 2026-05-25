import { useState, useEffect } from "react";
import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { useLanguageContext } from "../i18n/LanguageContext";
import { ModalNavbar } from "../navigation";
import type { TaskRecurringType } from "@/domain/task";

type RepeatOption =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

interface RepeatSelectorModalProps {
  recurringType: TaskRecurringType;
  interval: number;
  onBack: () => void;
  onConfirm: (
    repeat: TaskRecurringType,
    interval: number,
    repeatEnd: RepeatEnd,
    repeatEndDate: string | null,
    repeatEndOccurrences: number,
    useGregorian: boolean
  ) => void;
  useGregorian?: boolean;
  recurringEnd?: RepeatEnd;
  recurringEndDate?: string | null;
  recurringEndOccurrences?: number;
  onSelectEndDate: () => void;
  forceRecurring?: boolean; // If true, repeat is forced to be selected (no "none" option)
}

const REPEAT_UNITS: { value: TaskRecurringType; labelKey: string }[] = [
  { value: "daily", labelKey: "repeat_daily" },
  { value: "weekly", labelKey: "repeat_weekly" },
  { value: "monthly", labelKey: "repeat_monthly" },
  { value: "yearly", labelKey: "repeat_yearly" },
];

const INTERVAL_UNITS: { value: TaskRecurringType; labelKey: string }[] = [
  { value: "daily", labelKey: "Days" },
  { value: "weekly", labelKey: "Weeks" },
  { value: "monthly", labelKey: "Months" },
  { value: "yearly", labelKey: "Years" },
];

function isPreset(repeat: TaskRecurringType, interval: number): boolean {
  return repeat !== "none" && interval === 1;
}

function getInitialOption(
  repeat: TaskRecurringType,
  interval: number
): RepeatOption {
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
  recurringType,
  interval,
  onBack,
  onConfirm,
  recurringEnd: recurringEndProp = "never",
  recurringEndDate: recurringEndDate = null,
  recurringEndOccurrences: repeatEndOccurrencesProp = 1,
  onSelectEndDate,
  forceRecurring: forceRecurring = false,
  useGregorian: useGregorianProp = false,
}: RepeatSelectorModalProps) {
  const { t } = useLanguageContext();

  const [selectedOption, setSelectedOption] = useState<RepeatOption>(
    getInitialOption(recurringType, interval)
  );
  const [customInterval, setCustomInterval] = useState(
    interval > 1 ? interval : 1
  );
  const [customUnit, setCustomUnit] = useState<TaskRecurringType>(
    recurringType !== "none" ? recurringType : "daily"
  );
  const [selectedRepeatEnd, setSelectedRepeatEnd] =
    useState<RepeatEnd>(recurringEndProp);
  const [endOccurrences, setEndOccurrences] = useState(
    repeatEndOccurrencesProp
  );
  const [useGregorian, setUseGregorian] = useState(useGregorianProp);

  // Sync internal state when props change
  useEffect(() => {
    setSelectedRepeatEnd(recurringEndProp);
  }, [recurringEndProp]);

  useEffect(() => {
    setEndOccurrences(repeatEndOccurrencesProp);
  }, [repeatEndOccurrencesProp]);

  const handleConfirm = () => {
    if (selectedOption === "none") {
      onConfirm("none", 1, "never", null, 1, false);
    } else if (selectedOption === "custom") {
      onConfirm(
        customUnit,
        Math.max(1, customInterval),
        selectedRepeatEnd,
        recurringEndDate ?? null,
        endOccurrences,
        useGregorian
      );
    } else {
      onConfirm(
        selectedOption as TaskRecurringType,
        1,
        selectedRepeatEnd,
        recurringEndDate ?? null,
        endOccurrences,
        useGregorian
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
      <ModalNavbar
        title={t("repeat")}
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
            <select
              value={customInterval}
              onChange={(e) =>
                setCustomInterval(Math.max(2, parseInt(e.target.value) || 2))
              }
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from<number, number>({ length: 999 }, (_, k) => k).map(
                (i) => {
                  return (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  );
                }
              )}
            </select>
            <select
              value={customUnit}
              onChange={(e) =>
                setCustomUnit(e.target.value as TaskRecurringType)
              }
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

        {/* Gregorian toggle */}
        {selectedOption !== "none" && (
          <div className="flex items-center justify-between px-1 py-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("repeat_use_gregorian") || "Use Gregorian calendar"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={useGregorian}
              onClick={() => setUseGregorian((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useGregorian
                  ? "bg-[var(--hvsna-primary-color)]"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useGregorian ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
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
              {recurringEndDate
                ? formatRepeatEndDate(recurringEndDate)
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
      {!forceRecurring && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => handlePresetTap("none")}
            className="w-full px-4 py-3 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
          >
            {t("no_repeat")}
          </button>
        </div>
      )}
    </div>
  );
}
