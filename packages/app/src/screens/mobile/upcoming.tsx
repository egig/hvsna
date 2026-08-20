import { useState } from "react";
import { LargeNavbar } from "@/modules/navigation/navbar";
import {
  useUpcomingData,
  ScheduledContent,
  UnscheduledContent,
} from "@/modules/task/upcoming-shared";
import { Page } from "./page";

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
      navbarLarge={<LargeNavbar showBackButton={false} title={t("upcoming")} />}
    >
      {/* Mobile tab bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
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
