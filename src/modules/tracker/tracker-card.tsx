import { useNavigate } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackerStats } from "./use-tracker-stats";
import type { Tracker } from "../../domain/tracker/ITrackerRepository";

interface TrackerCardProps {
  tracker: Tracker;
  todayTimestamp?: number;
}

export function TrackerCard({ tracker, todayTimestamp }: TrackerCardProps) {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { data: stats } = useTrackerStats(tracker.id!, todayTimestamp);

  const displayValue = () => {
    if (!stats) return "–";
    if (tracker.inputMode === "toggle") {
      return stats.streak > 0 ? String(stats.streak) : "–";
    }
    if (tracker.inputMode === "set") {
      return stats.lastValue !== null ? String(stats.lastValue) : "–";
    }
    return stats.todayTotal > 0 ? String(stats.todayTotal) : "–";
  };

  const subLabel =
    tracker.inputMode === "toggle"
      ? "Streak"
      : tracker.unit
      ? `${t("stat_today") || "Today"} (${tracker.unit})`
      : t("stat_today") || "Today";

  return (
    <button
      onClick={() => navigate(`/tracks/${tracker.id}`)}
      className="flex flex-col rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.98] transition-transform text-left w-full overflow-hidden"
    >
      <div className="flex flex-col p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-2">
          {tracker.name}
        </p>
        <p className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">
          {displayValue()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {subLabel}
        </p>
      </div>
    </button>
  );
}
