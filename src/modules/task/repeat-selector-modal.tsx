import { useState } from "react";
import { HvCheck } from "@src/modules/icons";
import { useLanguageContext } from "../i18n/LanguageContext";
import { Navbar } from "../navigation";
import type { TaskRepeat } from "./types";

type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface RepeatSelectorModalProps {
  repeat: TaskRepeat;
  interval: number;
  onBack: () => void;
  onConfirm: (repeat: TaskRepeat, interval: number) => void;
}

const REPEAT_UNITS: { value: TaskRepeat; labelKey: string }[] = [
  { value: "daily", labelKey: "repeat_daily" },
  { value: "weekly", labelKey: "repeat_weekly" },
  { value: "monthly", labelKey: "repeat_monthly" },
  { value: "yearly", labelKey: "repeat_yearly" },
];

function isPreset(repeat: TaskRepeat, interval: number): boolean {
  return repeat !== "none" && interval === 1;
}

function getInitialOption(repeat: TaskRepeat, interval: number): RepeatOption {
  if (repeat === "none") return "none";
  if (interval === 1) return repeat;
  return "custom";
}

export function RepeatSelectorModal({
  repeat,
  interval,
  onBack,
  onConfirm,
}: RepeatSelectorModalProps) {
  const { t } = useLanguageContext();

  const [selectedOption, setSelectedOption] = useState<RepeatOption>(
    getInitialOption(repeat, interval),
  );
  const [customInterval, setCustomInterval] = useState(
    interval > 1 ? interval : 2,
  );
  const [customUnit, setCustomUnit] = useState<TaskRepeat>(
    repeat !== "none" ? repeat : "daily",
  );

  const handleConfirm = () => {
    if (selectedOption === "none") {
      onConfirm("none", 1);
    } else if (selectedOption === "custom") {
      onConfirm(customUnit, Math.max(1, customInterval));
    } else {
      onConfirm(selectedOption as TaskRepeat, 1);
    }
  };

  const handlePresetTap = (option: RepeatOption) => {
    setSelectedOption(option);
    // Immediately confirm for presets (excluding custom and none)
    if (option !== "custom" && option !== "none") {
      onConfirm(option as TaskRepeat, 1);
    } else if (option === "none") {
      onConfirm("none", 1);
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
        showBackButton={true}
        customBackAction={onBack}
        rightAction={
          selectedOption === "custom" ? (
            <button
              onClick={handleConfirm}
              className="rounded-full w-10 h-10 flex items-center justify-center text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] transition-colors"
            >
              <HvCheck />
            </button>
          ) : null
        }
      />

      <div className="p-4 flex flex-col gap-2">
        {/* Presets */}
        {REPEAT_UNITS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => handlePresetTap(value)}
            className={`${buttonBase} ${selectedOption === value ? activeClass : inactiveClass}`}
          >
            <span>{t(labelKey)}</span>
            {selectedOption === value && <HvCheck size={16} />}
          </button>
        ))}

        {/* Custom */}
        <button
          type="button"
          onClick={() => setSelectedOption("custom")}
          className={`${buttonBase} ${selectedOption === "custom" ? activeClass : inactiveClass}`}
        >
          <span>{t("repeat_custom") || "Custom"}</span>
          {selectedOption === "custom" && <HvCheck size={16} />}
        </button>

        {/* Custom interval inputs */}
        {selectedOption === "custom" && (
          <div className="flex gap-2 mt-1 px-1">
            <input
              type="number"
              min={2}
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
              {REPEAT_UNITS.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
        )}
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
