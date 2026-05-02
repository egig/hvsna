import React from "react";
import { useNavigate } from "react-router";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackerLogs } from "./use-tracker-logs";
import { useTrackerStats } from "./use-tracker-stats";
import type { Tracker } from "../../domain/tracker/ITrackerRepository";

const COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#a855f7",
  orange: "#f97316",
  red: "#ef4444",
  pink: "#ec4899",
  teal: "#14b8a6",
  yellow: "#eab308",
};

interface TrackerCardProps {
  tracker: Tracker;
  todayDateHijri?: string;
}

export function TrackerCard({ tracker, todayDateHijri }: TrackerCardProps) {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { data: stats } = useTrackerStats(tracker.id!, todayDateHijri);

  const color = COLOR_MAP[tracker.color ?? "blue"] ?? "#3b82f6";
  const emoji = tracker.emoji || (tracker.type === "binary" ? "✅" : tracker.type === "tally" ? "🔢" : "📊");

  const getDisplayValue = () => {
    if (!stats) return "–";
    if (tracker.type === "binary") {
      const val = stats.lastValue;
      if (val === null) return "–";
      return val > 0 ? t("yes") || "Yes" : t("no_label") || "No";
    }
    if (tracker.type === "tally") {
      return String(stats.todayTotal ?? 0);
    }
    return stats.todayTotal !== undefined ? String(stats.todayTotal) : "–";
  };

  const getSubLabel = () => {
    if (tracker.type === "binary") return t("stat_today") || "Today";
    if (tracker.type === "tally") return t("stat_today") || "Today";
    return tracker.unit ? `${t("stat_today") || "Today"} (${tracker.unit})` : t("stat_today") || "Today";
  };

  return (
    <button
      onClick={() => navigate(`/tracks/${tracker.id}`)}
      className="flex flex-col p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.98] transition-transform text-left w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
        {tracker.name}
      </p>
      <p className="text-2xl font-bold mt-0.5" style={{ color }}>
        {getDisplayValue()}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getSubLabel()}</p>
    </button>
  );
}
