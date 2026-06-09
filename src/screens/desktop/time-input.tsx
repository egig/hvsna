import { useState } from "react";
import {
  HvClock,
  HvFajr,
  HvDhuhr,
  HvAsr,
  HvMaghrib,
  HvIsha,
} from "@/modules/icons";
import { Popover, PopoverDisclosure, usePopoverStore } from "@ariakit/react";
import type { PrayerTime } from "@/domain/task";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";

interface TimeInputProps {
  name: string;
  label?: string;
  time: string;
  disabled?: boolean;
  className?: string;
  onChange: (time: string | null, prayerTime?: PrayerTime) => void;
}

const PRAYER_TIMES: { value: PrayerTime; icon: React.ReactNode }[] = [
  { value: "Fajr", icon: <HvFajr size={16} /> },
  { value: "Dhuhr", icon: <HvDhuhr size={16} /> },
  { value: "Asr", icon: <HvAsr size={16} /> },
  { value: "Maghrib", icon: <HvMaghrib size={16} /> },
  { value: "Isha", icon: <HvIsha size={16} /> },
];

export default function TimeInputDesktop({
  name,
  label,
  time,
  disabled = false,
  className = "",
  onChange,
}: TimeInputProps) {
  const { t } = useLanguageContext();
  const popover = usePopoverStore({ placement: "bottom-start" });

  const isCustom = typeof time === "string" && time.includes(":");
  const [customTime, setCustomTime] = useState(isCustom ? time : "");
  const [inputMode, setInputMode] = useState<"prayer" | "custom">(
    isCustom ? "custom" : "prayer"
  );

  const activeBtn =
    "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]";
  const inactiveBtn =
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  const handlePrayerSelect = (prayer: PrayerTime) => {
    setInputMode("prayer");
    onChange(prayer);
    popover.hide();
  };

  const handleCustomConfirm = () => {
    if (customTime) {
      setInputMode("custom");
      onChange(customTime);
      popover.hide();
    }
  };

  const handleRemove = () => {
    onChange(null);
    popover.hide();
  };

  const triggerButton = (
    <button
      type="button"
      disabled={disabled}
      className={`h-[38px] px-3 border border-gray-300 dark:border-gray-600 rounded-md flex items-center gap-2 text-sm transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600"
          : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
      } ${
        time
          ? "text-gray-900 dark:text-white"
          : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <HvClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
      {time && <span>{time}</span>}
    </button>
  );

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <PopoverDisclosure render={triggerButton} store={popover} />
      <Popover
        portal
        store={popover}
        gutter={8}
        hideOnInteractOutside={true}
        className="z-[10001] w-[260px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-3">
          {/* Prayer times + custom time in one grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {PRAYER_TIMES.map(({ value, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handlePrayerSelect(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  inputMode === "prayer" && time === value
                    ? activeBtn
                    : inactiveBtn
                }`}
              >
                {icon}
                {t(value.toLowerCase())}
              </button>
            ))}

            {/* Custom time — button-style container with embedded input */}
            <div
              className={`relative flex items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                inputMode === "custom" ? activeBtn : inactiveBtn
              } ${
                !customTime || inputMode === "prayer"
                  ? "before:content-['Custom'] before:text-gray-400 before:dark:text-gray-500 before:absolute before:left-3 before:pointer-events-none focus-within:before:hidden"
                  : ""
              }`}
            >
              <input
                type="time"
                value={inputMode === "custom" ? customTime : ""}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  setInputMode("custom");
                }}
                className={`outline-none bg-transparent w-full relative z-10 focus:text-inherit ${
                  inputMode === "prayer" ? "text-transparent" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer: Remove Time + Done */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-[var(--hvsna-danger-color)] hover:text-[var(--hvsna-danger-color-hover)] px-1 py-1 transition-colors"
          >
            {t("remove_time") || "Remove Time"}
          </button>
          <button
            type="button"
            onClick={handleCustomConfirm}
            disabled={!customTime}
            className="px-4 py-1.5 text-sm bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("done") || "Done"}
          </button>
        </div>
      </Popover>
    </div>
  );
}
