import { useNavigate } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackerStats } from "./use-tracker-stats";
import type { Tracker, TrackerEvalStatus } from "../../domain/tracker/ITrackerRepository";

const STATUS_COLOR: Record<TrackerEvalStatus, string> = {
  on_track: "#22c55e",
  at_risk: "#f97316",
  off_track: "#ef4444",
  achieved: "#22c55e",
  failed: "#ef4444",
};

const GOAL_TYPES = new Set(["habit", "build_up", "cut_down", "target", "range"]);

interface TrackerCardProps {
  tracker: Tracker;
  todayTimestamp?: number;
}

export function TrackerCard({ tracker, todayTimestamp }: TrackerCardProps) {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { data: stats } = useTrackerStats(tracker.id!, todayTimestamp);

  const isGoalType = GOAL_TYPES.has(tracker.type ?? "");

  const getDisplayValue = () => {
    if (!stats) return "–";
    if (tracker.type === "binary") {
      const val = stats.lastValue;
      if (val === null) return "–";
      return val > 0 ? t("yes") || "Yes" : t("no_label") || "No";
    }
    if (tracker.type === "habit") {
      if (tracker.targetValue && tracker.targetValue > 0) {
        const unit = tracker.unit ? ` ${tracker.unit}` : "";
        return `${stats.todayTotal ?? 0}/${tracker.targetValue}${unit}`;
      }
      return stats.currentStreak && stats.currentStreak > 0 ? String(stats.currentStreak) : "–";
    }
    if (tracker.type === "tally") {
      return String(stats.todayTotal ?? 0);
    }
    if (tracker.type === "target" || tracker.type === "range") {
      return stats.lastValue !== null && stats.lastValue !== undefined ? String(stats.lastValue) : "–";
    }
    return stats.todayTotal !== undefined ? String(stats.todayTotal) : "–";
  };

  const getSubLabel = () => {
    if (tracker.type === "habit") {
      if (tracker.targetValue && tracker.targetValue > 0) return t("stat_today") || "Today";
      return stats?.currentStreak && stats.currentStreak > 0 ? "day streak" : t("stat_today") || "Today";
    }
    if (tracker.type === "binary") return t("stat_today") || "Today";
    if (tracker.type === "tally") return t("stat_today") || "Today";
    return tracker.unit ? `${t("stat_today") || "Today"} (${tracker.unit})` : t("stat_today") || "Today";
  };

  const progress = isGoalType && stats?.currentScore !== undefined
    ? Math.min(100, Math.max(0, stats.currentScore))
    : undefined;

  const isQuantifiedHabit = tracker.type === "habit" && tracker.targetValue && tracker.targetValue > 0;
  const streak = isQuantifiedHabit && stats?.currentStreak !== undefined && stats.currentStreak > 1
    ? stats.currentStreak
    : undefined;

  const status = isGoalType ? stats?.currentStatus : undefined;

  return (
    <button
      onClick={() => navigate(`/tracks/${tracker.id}`)}
      className="flex flex-col rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.98] transition-transform text-left w-full overflow-hidden"
    >
      <div className="flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {tracker.name}
        </p>
        {status && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: STATUS_COLOR[status] }}
            title={status.replace("_", " ")}
          />
        )}
      </div>
      <p className="text-2xl font-bold mt-0.5 text-gray-900 dark:text-white">
        {getDisplayValue()}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-gray-500 dark:text-gray-400">{getSubLabel()}</p>
        {streak !== undefined && (
          <p className="text-xs text-orange-500 font-medium">🔥 {streak}</p>
        )}
      </div>

      {/* Progress bar for goal types */}
      {progress !== undefined && (
        <div className="mt-3 w-full">
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: status ? STATUS_COLOR[status] : "var(--hvsna-primary-color)",
              }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{progress}%</p>
        </div>
      )}
      </div>
    </button>
  );
}
