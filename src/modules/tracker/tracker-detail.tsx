import React from "react";
import { useParams } from "react-router";
import { Page } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { useTrackerLogs } from "./useTrackerLogs";
import { useRecurringTasks } from "../task/use-recurring-tasks";
import { TrackerChart } from "./components/chart-wrapper";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { RecurringTask } from "../task/recurring-task";
import type { TrackerLog } from "../../domain/tracker/TrackerLog";

export function TrackerDetail() {
  const { trackerId } = useParams<{ trackerId: string }>();
  const { t } = useLanguageContext();
  const { getRecentLogs } = useTrackerLogs();
  const { getRecurringTask } = useRecurringTasks();
  const [tracker, setTracker] = React.useState<RecurringTask | null>(null);
  const [logs, setLogs] = React.useState<TrackerLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadTracker = async () => {
      if (!trackerId) return;

      try {
        const recurringTask = await getRecurringTask(trackerId);
        setTracker(recurringTask || null);

        if (recurringTask) {
          const recentLogs = await getRecentLogs(trackerId);
          setLogs(recentLogs);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load tracker";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadTracker();
  }, [trackerId, getRecentLogs, getRecurringTask]);

  if (loading) {
    return (
      <Page
        navbar={
          <Navbar
            title={t("tracker_detail") || "Tracker Detail"}
            showBackButton={true}
          />
        }
      >
        <div className="p-4 text-center text-gray-500">
          {t("loading") || "Loading..."}
        </div>
      </Page>
    );
  }

  if (error || !tracker) {
    return (
      <Page
        navbar={
          <Navbar
            title={t("tracker_detail") || "Tracker Detail"}
            showBackButton={true}
          />
        }
      >
        <div className="p-4 text-center text-red-500">
          {error || t("tracker_not_found") || "Tracker not found"}
        </div>
      </Page>
    );
  }

  const inputMode = tracker.inputMode || "toggle";

  return (
    <Page navbar={<Navbar title={tracker.name} showBackButton={true} />}>
      <div className="p-4 space-y-6">
        {/* Tracker Info */}
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {tracker.name}
          </h2>
          {tracker.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {tracker.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {inputMode === "toggle"
                ? t("toggle") || "Toggle"
                : inputMode === "add"
                ? t("add") || "Add"
                : t("set") || "Set"}
            </span>
            {tracker.unit && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {tracker.unit}
              </span>
            )}
            {tracker.target && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {t("target") || "Target"}: {tracker.target}
              </span>
            )}
            {tracker.period && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {t("period") || "Period"}: {tracker.period}
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t("chart") || "Chart"}
          </h3>
          <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
            <TrackerChart
              logs={logs}
              inputMode={inputMode}
              unit={tracker.unit}
            />
          </div>
        </div>

        {/* Logs History */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t("logs_history") || "Logs History"}
          </h3>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                {t("no_logs") || "No logs yet"}
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {log.value}
                      {tracker.unit && (
                        <span className="text-sm ml-1">{tracker.unit}</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {log.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
