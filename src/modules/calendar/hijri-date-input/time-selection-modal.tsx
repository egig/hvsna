import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { Navbar } from "src/modules/navigation";

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

  useEffect(() => {
    if (selectedTime) {
      const [h, m] = selectedTime?.split(":") || [0, 0];
      setHour(parseInt(h));
      setMinute(parseInt(m));
    }
  }, [selectedTime]);

  return (
    <div className="h-[50vh]">
      <Navbar
        title={t("select_time")}
        showBackButton={true}
        customBackAction={onBack}
        rightAction={
          <button
            onClick={() => {
              onConfirm(
                `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
              );
            }}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] transition-colors"
          >
            <Check />
          </button>
        }
      />
      <div className="flex p-2 gap-2">
        <select
          value={hour.toString()}
          onChange={(e) => setHour(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: 24 }, (_, i) => (
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
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onRemoveTime}
          disabled={false}
          className="w-full px-4 py-3 hover:text-red-600 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {t("remove_time")}
        </button>
      </div>
    </div>
  );
}
