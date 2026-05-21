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
import { getCoordinateFromTimezone } from "@/config";
import { useEffect, useState, type ReactNode } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { ModalNavbar } from "src/modules/navigation";
import { useSettings } from "src/modules/settings";
import * as SunCalc from "suncalc";
import type { PrayerTime } from "@/domain/task";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";

/**
 * Generates an array of hours sorted from sunset to next sunset based on geographic coordinates
 * @param lat Latitude for sunset calculation
 * @param lng Longitude for sunset calculation
 * @returns Array of hours (0-23) sorted starting from sunset hour
 */
function getSunsetBasedSortedHours(lat: number, lng: number): number[] {
  try {
    const today = new Date();
    const times = SunCalc.getTimes(today, lat, lng);

    if (times.sunset && times.sunrise) {
      const sunsetHour = times.sunset.getHours();
      const eveningHours = Array.from(
        { length: 24 - sunsetHour },
        (_, i) => (sunsetHour + i) % 24
      );
      const remainingHours = Array.from({ length: sunsetHour }, (_, i) => i);

      return [...eveningHours, ...remainingHours];
    } else {
      // Fallback to regular 0-23 order if calculation fails
      return Array.from({ length: 24 }, (_, i) => i);
    }
  } catch (error) {
    console.warn(
      "SunCalc calculation failed in getSunsetBasedSortedHours:",
      error
    );
    // Fallback to regular 0-23 order
    return Array.from({ length: 24 }, (_, i) => i);
  }
}

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
  const { settings } = useSettings();
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [sortedHours, setSortedHours] = useState<number[]>([]);
  const [selectedPrayer, setSelectedPrayer] = useState<string>(
    selectedTime || ""
  );

  let isCustom = !!selectedTime && selectedTime.includes(":");
  const [inputMode, setInputMode] = useState<"prayer" | "custom">(
    isCustom ? "custom" : "prayer"
  );

  const prayerTimes: PrayerTime[] = [
    "Maghrib",
    "Isha",
    "Fajr",
    "Sunrise",
    "Dhuhr",
    "Asr",
  ];

  const prayerIcons: Record<string, ReactNode> = {
    Maghrib: <HvMaghrib size={20} />,
    Isha: <HvIsha size={20} />,
    Fajr: <HvFajr size={20} />,
    Sunrise: <HvSunrise size={20} />,
    Dhuhr: <HvDhuhr size={20} />,
    Asr: <HvAsr size={20} />,
  };

  useEffect(() => {
    if (isCustom) {
      const [h, m] = selectedTime?.split(":") || [0, 0];
      setHour(parseInt(h as string));
      setMinute(parseInt(m as string));
    }
  }, [selectedTime]);

  useEffect(() => {
    const _fallback = getCoordinateFromTimezone(settings.timezone ?? "");
    const lat = settings.location?.lat ?? _fallback.latitude;
    const lng = settings.location?.lng ?? _fallback.longitude;
    setSortedHours(getSunsetBasedSortedHours(lat, lng));
  }, [settings.location, settings.timezone]);

  const handleCustomTimeConfirm = () => {
    const time = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    onConfirm(time);
  };

  const handlePrayerTimeConfirm = () => {
    if (selectedPrayer) {
      onConfirm(selectedPrayer);
    }
  };

  const handleConfirm = () => {
    if (inputMode === "prayer" && selectedPrayer) {
      handlePrayerTimeConfirm();
    } else if (inputMode === "custom") {
      handleCustomTimeConfirm();
    }
  };

  return (
    <div className="min-h-[25dvh]">
      <ModalNavbar
        title={t("select_time")}
        onModalClose={onBack}
        rightAction={
          <NavActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={inputMode === "prayer" ? !selectedPrayer : false}
          >
            <HvCheck />
          </NavActionButton>
        }
      />

      <div className="px-2">
        <div className="flex justify-center gap-1 mb-1 border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setInputMode("prayer")}
            className={`px-2 py-1 rounded-t-md transition-colors border-b-2 text-sm ${
              inputMode === "prayer"
                ? "bg-white dark:bg-gray-800 text-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]"
                : "bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t("prayer_time") || "Prayer Time"}
          </button>
          <button
            onClick={() => setInputMode("custom")}
            className={`px-2 py-1 rounded-t-md transition-colors border-b-2 text-sm ${
              inputMode === "custom"
                ? "bg-white dark:bg-gray-800 text-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]"
                : "bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {t("custom_time") || "Custom Time"}
          </button>
        </div>
      </div>

      {inputMode === "prayer" && (
        <div className="p-4">
          <ToggleGroup
            value={selectedPrayer ? [selectedPrayer] : []}
            onValueChange={(values) => {
              const selected = values[0] as PrayerTime | "";
              setSelectedPrayer(selected);
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
          </ToggleGroup>
        </div>
      )}

      {inputMode === "custom" && (
        <div className="p-4">
          <div className="flex gap-2">
            <select
              value={hour.toString()}
              onChange={(e) => setHour(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {sortedHours.map((i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="flex items-center text-gray-500 dark:text-gray-400">
              :
            </span>
            <select
              value={minute.toString()}
              onChange={(e) => setMinute(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
