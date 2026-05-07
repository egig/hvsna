import React from "react";
import { Page } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { useRecurringTasks } from "./use-recurring-tasks";
import { EmptyState } from "../components/empty-state";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HvChartArea } from "@/modules/icons";

export function Insight() {
  const { t } = useLanguageContext();
  const { getRecurringTasks, loading, error } = useRecurringTasks();

  const [trackers, setTrackers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadTrackers = async () => {
      try {
        const allRecurringTasks = await getRecurringTasks();
        console.log(allRecurringTasks, "add rtask")
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
    <Page navbar={<Navbar title={t("insight") || "Insight"} showBackButton={false} />}>
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500">{t("loading") || "Loading..."}</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : trackers.length === 0 ? (
          <EmptyState
            icon={<HvChartArea className="w-full h-full" />}
            title={t("no_trackers") || "No trackers"}
            description={t("no_trackers_description") || "Trackers will appear here"}
          />
        ) : (
          <div className="space-y-2">
            {trackers.map((tracker) => (
              <div
                key={tracker.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {tracker.name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
