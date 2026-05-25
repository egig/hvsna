import {
  HvAsr,
  HvCheck,
  HvDhuhr,
  HvFajr,
  HvIsha,
  HvMaghrib,
  HvSunrise,
} from "@/modules/icons";
import { NavActionButton } from "../../components/nav-action-button";
import { useState, type ReactNode } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { ModalNavbar } from "src/modules/navigation";
import type { PrayerTime } from "@/domain/task";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";

interface TimeSelectionModalProps {
  selectedTime: string | null;
  onBack: () => void;
  onConfirm: (time: string) => void;
  onRemoveTime: () => void;
}

export function TimeSelectionModal({
  selectedTime,
  onBack,
  onConfirm,
  onRemoveTime,
}: TimeSelectionModalProps) {
  const { t } = useLanguageContext();
  const [selectedTimeTemp, setSelectedTimeTemp] = useState<string>(
    selectedTime || ""
  );

  let isCustom = !!selectedTime && selectedTime.includes(":");
  const [inputMode, setInputMode] = useState<"prayer" | "custom">(
    isCustom ? "custom" : "prayer"
  );

  const prayerTimes: PrayerTime[] = ["Maghrib", "Isha", "Fajr", "Dhuhr", "Asr"];

  const prayerIcons: Record<string, ReactNode> = {
    Maghrib: <HvMaghrib size={20} />,
    Isha: <HvIsha size={20} />,
    Fajr: <HvFajr size={20} />,
    Sunrise: <HvSunrise size={20} />,
    Dhuhr: <HvDhuhr size={20} />,
    Asr: <HvAsr size={20} />,
  };

  const handleCustomTimeConfirm = () => {
    onConfirm(selectedTimeTemp as string);
  };

  const handlePrayerTimeConfirm = () => {
    if (selectedTimeTemp) {
      onConfirm(selectedTimeTemp);
    }
  };

  const handleConfirm = () => {
    if (inputMode === "prayer" && selectedTimeTemp) {
      handlePrayerTimeConfirm();
    } else if (inputMode === "custom") {
      handleCustomTimeConfirm();
    }
  };

  return (
    <div className="min-h-[25dvh]">
      <ModalNavbar
        title={t("time")}
        onModalClose={onBack}
        rightAction={
          <NavActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={inputMode === "prayer" ? !selectedTimeTemp : false}
          >
            <HvCheck />
          </NavActionButton>
        }
      />

      <div className="p-4">
        <ToggleGroup
          value={selectedTimeTemp ? [selectedTimeTemp] : []}
          onValueChange={(values) => {
            const selected = values[0] as PrayerTime | "";
            setSelectedTimeTemp(selected);
            if (selected) {
              onConfirm(selected);
            }
          }}
          multiple={false}
          className="grid grid-cols-2 gap-2"
        >
          {prayerTimes.map((prayer) => (
            <Toggle
              key={prayer}
              value={prayer}
              className={({ pressed }) =>
                `flex gap-1 items-center px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                  pressed
                    ? "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`
              }
            >
              {prayerIcons[prayer as string]} {t(prayer.toLowerCase())}
            </Toggle>
          ))}
          <div
            className={`relative flex items-center px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
              inputMode === "custom"
                ? "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]"
                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            } ${
              (!selectedTimeTemp && inputMode === "custom") ||
              inputMode === "prayer"
                ? "before:content-['Custom_Time'] before:text-gray-500 before:dark:text-gray-400 before:absolute before:left-3 before:pointer-events-none focus-within:before:hidden"
                : ""
            }`}
          >
            <input
              className={`outline-none bg-transparent w-full relative z-10 focus:text-inherit ${
                inputMode === "prayer" ? "text-transparent" : ""
              }`}
              type="time"
              value={inputMode === "custom" ? (selectedTimeTemp as string) : ""}
              onChange={(e) => {
                setSelectedTimeTemp(e.target.value);
                setInputMode("custom");
              }}
            />
          </div>
        </ToggleGroup>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onRemoveTime}
          disabled={false}
          className="w-full px-4 py-3 hover:text-red-600 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {t("remove_time") || "Remove Time"}
        </button>
      </div>
    </div>
  );
}
