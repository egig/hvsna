import { useState } from "react";
import { Navbar } from "@/modules/navigation/navbar";
import { Page } from "@/modules/navigation";
import {
  useUpcomingData,
  ScheduledContent,
  UnscheduledContent,
} from "@/modules/task/upcoming-shared";

export default function UpcomingMobile() {
  const {
    t,
    canLoadMore,
    handleLoadMore,
    upcomingTasks,
    taskGroupsWithLabels,
    laterGroups,
    isLoadingMore,
    unscheduledTasks,
    inboxInitiated,
  } = useUpcomingData();

  const [mobileTab, setMobileTab] = useState<"scheduled" | "unscheduled">(
    "scheduled"
  );

  return (
    <Page
      navbar={
        <Navbar
          showBackButton={false}
          title={t("upcoming")}
          rightAction={null}
        />
      }
    >
      {/* Mobile tab bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-20">
        <button
          onClick={() => setMobileTab("scheduled")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileTab === "scheduled"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {t("scheduled") || "Scheduled"}
        </button>
        <button
          onClick={() => setMobileTab("unscheduled")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileTab === "unscheduled"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {t("unscheduled") || "Unscheduled"}
        </button>
      </div>

      {mobileTab === "scheduled" ? (
        <ScheduledContent
          upcomingTasks={upcomingTasks}
          taskGroupsWithLabels={taskGroupsWithLabels}
          laterGroups={laterGroups}
          isReady={true}
          effectiveMode="list"
          t={t}
          onLoadMore={handleLoadMore}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
        />
      ) : (
        <UnscheduledContent
          inboxTasks={unscheduledTasks}
          inboxInitiated={inboxInitiated}
          t={t}
        />
      )}
    </Page>
  );
}
