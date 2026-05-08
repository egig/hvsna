import React from "react";
import { Page } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { useTrackers } from "../tracker/useTrackers";
import { useTrackerLogs } from "../tracker/useTrackerLogs";
import { EmptyState } from "../components/empty-state";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvChartArea } from "@/modules/icons";
import type { Tracker } from "../../domain/tracker/Tracker";

interface TrackerCardProps {
  tracker: Tracker;
}

function TrackerCard({ tracker }: TrackerCardProps) {
  const { t } = useLanguageContext();
  const { getLatestLog } = useTrackerLogs();
  const [latestLog, setLatestLog] = React.useState<any>(null);

  React.useEffect(() => {
    const loadLatestLog = async () => {
      try {
        const log = await getLatestLog(tracker.id);
        setLatestLog(log);
      } catch (err) {
        console.error("Failed to load latest log:", err);
      }
    };

    loadLatestLog();
  }, [tracker.id, getLatestLog]);

  const displayValue = () => {
    if (tracker.inputMode === "toggle") {
      return latestLog ? "1" : "–";
    }
    if (tracker.inputMode === "set") {
      return latestLog !== null ? String(latestLog.value) : "–";
    }
    return latestLog !== null ? String(latestLog.value) : "–";
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
  const { getTrackers, loading, error } = useTrackers();

  const [trackers, setTrackers] = React.useState<Tracker[]>([]);

  React.useEffect(() => {
    const loadTrackers = async () => {
      try {
        const allTrackers = await getTrackers();
        setTrackers(allTrackers);
      } catch (err) {
        console.error("Failed to load trackers:", err);
      }
    };

    loadTrackers();
  }, [getTrackers]);

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
