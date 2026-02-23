import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { Navbar } from "src/modules/navigation";
import { useSettings } from "src/modules/settings/useSettings";
import * as SunCalc from "suncalc";
import type { PrayerTime } from "src/modules/task/types";

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
        (_, i) => (sunsetHour + i) % 24,
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
      error,
    );
    // Fallback to regular 0-23 order
    return Array.from({ length: 24 }, (_, i) => i);
  }
}

interface TimeSelectionModalProps {
  selectedTime: string | null;
  selectedPrayerTime?: PrayerTime;
  onBack: () => void;
  onConfirm: (time: string, prayerTime?: PrayerTime | string) => void;
  onRemoveTime: () => void;
}

export function TimeSelectionModal({
  selectedTime,
  selectedPrayerTime,
  onBack,
  onConfirm,
  onRemoveTime,
}: TimeSelectionModalProps) {
  const { t } = useLanguageContext();
  const { settings } = useSettings();
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [sortedHours, setSortedHours] = useState<number[]>([]);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime | "">(
    selectedPrayerTime || "",
  );
  const [inputMode, setInputMode] = useState<"prayer" | "custom">(
    selectedTime ? "custom" : "prayer",
  );

  const prayerTimes: PrayerTime[] = [
    "Maghrib",
    "Isha",
    "Fajr",
    "Sunrise",
    "Dhuhr",
    "Asr",
  ];
  useEffect(() => {
    if (selectedTime) {
      const [h, m] = selectedTime?.split(":") || [0, 0];
      setHour(parseInt(h));
      setMinute(parseInt(m));
    }
  }, [selectedTime]);

  useEffect(() => {
    const lat = settings.coordinate?.latitude ?? -6.2088;
    const lng = settings.coordinate?.longitude ?? 106.8456;
    setSortedHours(getSunsetBasedSortedHours(lat, lng));
  }, [settings.coordinate]);

  const handleCustomTimeConfirm = () => {
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onConfirm(time, "");
  };

  const handlePrayerTimeConfirm = () => {
    if (selectedPrayer) {
      onConfirm("", selectedPrayer);
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
    <div className="">
      <Navbar
        title={t("select_time")}
        showBackButton={true}
        customBackAction={onBack}
        rightAction={
          <button
            onClick={handleConfirm}
            disabled={inputMode === "prayer" ? !selectedPrayer : false}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Check />
          </button>
        }
      />

      <div className="p-2">
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
          <select
            value={selectedPrayer}
            onChange={(e) =>
              setSelectedPrayer(e.target.value as PrayerTime | "")
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">
              {t("select_prayer_time") || "Select Prayer Time"}
            </option>
            {prayerTimes.map((prayer) => (
              <option key={prayer} value={prayer}>
                {t(prayer.toLowerCase())}
              </option>
            ))}
          </select>
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
