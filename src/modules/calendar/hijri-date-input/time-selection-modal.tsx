import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { Navbar } from "src/modules/navigation";
import * as SunCalc from "suncalc";

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
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [sortedHours, setSortedHours] = useState<number[]>([]);

  useEffect(() => {
    if (selectedTime) {
      const [h, m] = selectedTime?.split(":") || [0, 0];
      setHour(parseInt(h));
      setMinute(parseInt(m));
    }
  }, [selectedTime]);

  useEffect(() => {
    // Calculate sunset and sunrise times for today
    // Use Jakarta coordinates as default (same as HijriDate)
    const lat = -6.2088;
    const lng = 106.8456;

    try {
      const today = new Date();
      const times = SunCalc.getTimes(today, lat, lng);

      if (times.sunset && times.sunrise) {
        const sunsetHour = times.sunset.getHours();
        const sunriseHour = times.sunrise.getHours();

        // Create array of hours sorted from sunset to next sunset
        // Evening hours (sunset to 23) first, then all remaining hours (0 to sunset-1)
        const eveningHours = Array.from(
          { length: 24 - sunsetHour },
          (_, i) => (sunsetHour + i) % 24,
        );
        const remainingHours = Array.from({ length: sunsetHour }, (_, i) => i);

        setSortedHours([...eveningHours, ...remainingHours]);
      } else {
        // Fallback to regular 0-23 order if calculation fails
        setSortedHours(Array.from({ length: 24 }, (_, i) => i));
      }
    } catch (error) {
      console.warn("SunCalc calculation failed in TimeSelectionModal:", error);
      // Fallback to regular 0-23 order
      setSortedHours(Array.from({ length: 24 }, (_, i) => i));
    }
  }, []);

  const handleCustomTimeConfirm = () => {
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onConfirm(time);
  };

  return (
    <div className="">
      <Navbar
        title={t("select_time")}
        showBackButton={true}
        customBackAction={onBack}
        rightAction={
          <button
            onClick={handleCustomTimeConfirm}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] transition-colors"
          >
            <Check />
          </button>
        }
      />

      {/* Custom Time Selection */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t("custom_time") || "Custom Time"}
          </span>
          <div className="w-4 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
        </div>

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
