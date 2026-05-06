import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { useTrackers } from "./use-trackers";
import { useLanguageContext } from "../../modules/i18n/LanguageContext";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

interface Props {
  trackerCount: number;
  todayTimestamp?: number;
}

export function TrackerSummaryCard({ trackerCount, todayTimestamp }: Props) {
  const { t } = useLanguageContext();
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const dayKey = todayTimestamp
    ? startOfDay(todayTimestamp)
    : startOfDay(Date.now());

  const { data: trackers = [], isLoading: trackersLoading } = useTrackers();

  const evalEntries = useMemo(() => {
    const entries: { trackerId: string; evalId: string }[] = [];
    for (const t of trackers) {
      for (const ev of t.evaluations ?? []) {
        if (ev.id) entries.push({ trackerId: t.id!, evalId: ev.id });
      }
    }
    return entries;
  }, [trackers]);

  const results = useQueries({
    queries: evalEntries.map(({ trackerId, evalId }) => ({
      queryKey: ["tracker-eval-result", trackerId, evalId, dayKey],
      queryFn: () => useCases.getEvaluationResult(trackerId, evalId, dayKey),
      staleTime: 1000 * 60 * 2,
      enabled: Boolean(trackerId) && Boolean(evalId),
    })),
  });

  const counts = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let pending = 0;
    results.forEach((r) => {
      const success = r.data?.success;
      if (success === undefined) pending++;
      else if (success) pass++;
      else fail++;
    });
    return { pass, fail, pending };
  }, [results]);

  const isLoading = trackersLoading || results.some((r) => r.isLoading);
  const total = evalEntries.length;

  if (trackerCount === 0) return null;

  const { pass, fail, pending } = counts;
  const healthPct = total > 0 ? Math.round((pass / total) * 100) : null;

  return (
    <div className="col-span-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("overview") || "Overview"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("tracker_count", { count: trackerCount }) ||
            `${trackerCount} tracker${trackerCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {isLoading ? (
        <div className="h-6 flex items-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[var(--hvsna-primary-color)] rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("no_evaluations_yet") || "No evaluations yet"}
        </p>
      ) : (
        <>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
            {pass > 0 && (
              <div
                className="h-full rounded-full"
                style={{ flex: pass, backgroundColor: "#22c55e" }}
              />
            )}
            {fail > 0 && (
              <div
                className="h-full rounded-full"
                style={{ flex: fail, backgroundColor: "#ef4444" }}
              />
            )}
            {pending > 0 && (
              <div
                className="h-full rounded-full bg-gray-200 dark:bg-gray-600"
                style={{ flex: pending }}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {pass > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#22c55e" }}
                />
                {pass} {t("passing") || "passing"}
              </span>
            )}
            {fail > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#ef4444" }}
                />
                {fail} {t("failing") || "failing"}
              </span>
            )}
            {pending > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                {pending} {t("pending") || "pending"}
              </span>
            )}
          </div>

          {healthPct !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t("passing_pct", { pct: healthPct }) || `${healthPct}% passing`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default TrackerSummaryCard;
