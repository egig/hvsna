import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import type {
  Tracker,
  TrackerEvalStatus,
} from "../../domain/tracker/ITrackerRepository";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const STATUS_META: Record<TrackerEvalStatus, { label: string; color: string }> =
  {
    on_track: { label: "On track", color: "#22c55e" },
    achieved: { label: "Achieved", color: "#22c55e" },
    at_risk: { label: "At risk", color: "#f97316" },
    off_track: { label: "Off track", color: "#ef4444" },
    failed: { label: "Failed", color: "#ef4444" },
  };

const GOAL_TYPES = new Set(["habit", "build_up", "cut_down"]);

interface Props {
  trackers: Tracker[];
  todayTimestamp?: number;
}

export function TrackerSummaryCard({ trackers, todayTimestamp }: Props) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const dayKey = todayTimestamp ? startOfDay(todayTimestamp) : undefined;
  const { currentHijriDate } = useHijriDate();
  const weekStartDay = currentHijriDate._startOfWeek ?? 5;

  const results = useQueries({
    queries: trackers.map((tracker) => ({
      queryKey: [...queryKeys.trackerStats(tracker.id!), dayKey, weekStartDay],
      queryFn: () => useCases.getStats(tracker.id!, dayKey, weekStartDay),
      staleTime: 1000 * 60 * 2,
      enabled: Boolean(tracker.id),
    })),
  });

  const counts = useMemo(() => {
    const tally: Partial<Record<TrackerEvalStatus, number>> = {};
    let goalTotal = 0;

    trackers.forEach((tracker, i) => {
      if (!GOAL_TYPES.has(tracker.type ?? "")) return;
      goalTotal++;
      const status = results[i]?.data?.currentStatus;
      if (status) tally[status] = (tally[status] ?? 0) + 1;
    });

    return { tally, goalTotal };
  }, [trackers, results]);

  const isLoading = results.some((r) => r.isLoading);
  const { tally, goalTotal } = counts;

  if (trackers.length === 0) return null;

  const goodCount = (tally.on_track ?? 0) + (tally.achieved ?? 0);
  const warnCount = tally.at_risk ?? 0;
  const badCount = (tally.off_track ?? 0) + (tally.failed ?? 0);
  const unknownCount = goalTotal - goodCount - warnCount - badCount;

  const healthPct =
    goalTotal > 0 ? Math.round((goodCount / goalTotal) * 100) : null;

  const statusEntries = (Object.entries(tally) as [TrackerEvalStatus, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ status, count }));

  return (
    <div className="col-span-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Overview
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {trackers.length} tracker{trackers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="h-6 flex items-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
        </div>
      ) : goalTotal === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          No goal trackers yet
        </p>
      ) : (
        <>
          {/* Segmented bar */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
            {goodCount > 0 && (
              <div
                className="h-full rounded-full"
                style={{ flex: goodCount, backgroundColor: "#22c55e" }}
              />
            )}
            {warnCount > 0 && (
              <div
                className="h-full rounded-full"
                style={{ flex: warnCount, backgroundColor: "#f97316" }}
              />
            )}
            {badCount > 0 && (
              <div
                className="h-full rounded-full"
                style={{ flex: badCount, backgroundColor: "#ef4444" }}
              />
            )}
            {unknownCount > 0 && (
              <div
                className="h-full rounded-full bg-gray-200 dark:bg-gray-600"
                style={{ flex: unknownCount }}
              />
            )}
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {statusEntries.map(({ status, count }) => (
              <span
                key={status}
                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_META[status].color }}
                />
                {count} {STATUS_META[status].label.toLowerCase()}
              </span>
            ))}
            {unknownCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                {unknownCount} pending
              </span>
            )}
          </div>

          {healthPct !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {healthPct}% on track
            </p>
          )}
        </>
      )}
    </div>
  );
}
