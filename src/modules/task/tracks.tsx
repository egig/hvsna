import React from "react";
import { Page } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { useRecurringTasks } from "./use-recurring-tasks";
import { EmptyState } from "../components/empty-state";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvChartArea } from "@/modules/icons";
import { usePouchDB } from "../../pouchdb";
import type { RecurringTask } from "./recurring-task";

interface TrackerCardProps {
  tracker: RecurringTask;
}

function TrackerCard({ tracker }: TrackerCardProps) {
  const { t } = useLanguageContext();
  const { db } = usePouchDB();
  const [logCount, setLogCount] = React.useState<number>(0);
  const [lastValue, setLastValue] = React.useState<number | null>(null);

  React.useEffect(() => {
    const loadTrackerLogs = async () => {
      try {
        const result = await db.allDocs({
          startkey: `tlog_${tracker.id}_`,
          endkey: `tlog_${tracker.id}_\uffff`,
        });
        setLogCount(result.rows.length);

        if (result.rows.length > 0) {
          const latestDoc = (await db.get(
            result.rows[result.rows.length - 1].id
          )) as any;
          setLastValue(latestDoc.value);
        }
      } catch (err) {
        console.error("Failed to load tracker logs:", err);
      }
    };

    loadTrackerLogs();
  }, [db, tracker.id]);

  const displayValue = () => {
    if (tracker.inputMode === "toggle") {
      return logCount > 0 ? String(logCount) : "–";
    }
    if (tracker.inputMode === "set") {
      return lastValue !== null ? String(lastValue) : "–";
    }
    return logCount > 0 ? String(logCount) : "–";
  };

  const subLabel =
    tracker.inputMode === "toggle"
      ? t("logs") || "Logs"
      : tracker.unit
      ? `${t("last_value") || "Last value"} (${tracker.unit})`
      : t("last_value") || "Last value";

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
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
  );
}

export function Tracks() {
  const { t } = useLanguageContext();
  const { getRecurringTasks, loading, error } = useRecurringTasks();

  const [trackers, setTrackers] = React.useState<RecurringTask[]>([]);

  React.useEffect(() => {
    const loadTrackers = async () => {
      try {
        const allRecurringTasks = await getRecurringTasks();
        console.log(allRecurringTasks, "add rtask");
        const trackerTasks = allRecurringTasks.filter(
          (task) => task.asTracker === true
        );
        setTrackers(trackerTasks);
      } catch (err) {
        console.error("Failed to load trackers:", err);
      }
    };

    loadTrackers();
  }, [getRecurringTasks]);

  return (
    <Page
      navbar={<Navbar title={t("tracks") || "Tracks"} showBackButton={false} />}
    >
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">
            {t("loading") || "Loading..."}
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : trackers.length === 0 ? (
          <EmptyState
            icon={<HvChartArea className="w-full h-full" />}
            title={t("no_trackers") || "No trackers"}
            description={
              t("no_trackers_description") || "Trackers will appear here"
            }
          />
        ) : (
          <div className="space-y-2">
            {trackers.map((tracker) => (
              <TrackerCard key={tracker.id} tracker={tracker} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
