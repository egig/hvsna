import { useState } from "react";
import { HvRepeat } from "@/modules/icons";
import { Modal } from "src/modules/navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { TaskRepeat } from "./types";

interface TrackTimeProps {
  repeat: TaskRepeat;
  repeatInterval: number;
  prayerTime?: string;
  onRepeatChange: (repeat: TaskRepeat, interval: number) => void;
  onPrayerTimeChange: (prayerTime?: string) => void;
  disabled?: boolean;
  className?: string;
}

const repeatOptions = [
  { value: "daily" as TaskRepeat, labelKey: "repeat_daily" },
  { value: "weekly" as TaskRepeat, labelKey: "repeat_weekly" },
  { value: "monthly" as TaskRepeat, labelKey: "repeat_monthly" },
];

const prayerTimeOptions = [
  { value: "", labelKey: "none" },
  { value: "fajr", labelKey: "fajr" },
  { value: "dhuhr", labelKey: "dhuhr" },
  { value: "asr", labelKey: "asr" },
  { value: "maghrib", labelKey: "maghrib" },
  { value: "isha", labelKey: "isha" },
];

function formatRepeatLabel(repeat: TaskRepeat, interval: number, t: (key: string) => string): string {
  if (repeat === "none") return t("no_repeat") || "No repeat";
  const option = repeatOptions.find((opt) => opt.value === repeat);
  const label = option ? t(option.labelKey) : repeat;
  return interval > 1 ? `${t("every") || "Every"} ${interval} ${label?.toLowerCase()}` : label;
}

function formatPrayerTimeLabel(prayerTime: string, t: (key: string) => string): string {
  if (!prayerTime) return t("custom_time") || "Custom time";
  const option = prayerTimeOptions.find((opt) => opt.value === prayerTime);
  return option ? t(option.labelKey) : prayerTime;
}

export function TrackTime({
  repeat,
  repeatInterval,
  prayerTime,
  onRepeatChange,
  onPrayerTimeChange,
  disabled = false,
  className = "",
}: TrackTimeProps) {
  const { t } = useLanguageContext();
  const [isOpen, setIsOpen] = useState(false);

  const repeatLabel = formatRepeatLabel(repeat, repeatInterval, t);
  const prayerTimeLabel = formatPrayerTimeLabel(prayerTime || "", t);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`h-full px-3 py-2 border rounded-md text-sm transition-colors flex items-center gap-2 ${
          disabled
            ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50 border-gray-300"
            : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer border-gray-300 dark:border-gray-600"
        } text-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]`}
      >
        <HvRepeat size={16} />
        <span>{repeatLabel}</span>
        {prayerTime && <span className="text-gray-500">· {prayerTimeLabel}</span>}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("track_schedule") || "Track Schedule"}
      >
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("repeat") || "Repeat"}
            </p>
            <div className="flex flex-col gap-2">
              {repeatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onRepeatChange(option.value, 1)}
                  className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                    repeat === option.value
                      ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("prayer_time") || "Prayer Time"}
            </p>
            <div className="flex flex-col gap-2">
              {prayerTimeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPrayerTimeChange(option.value || undefined)}
                  className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                    prayerTime === option.value
                      ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
