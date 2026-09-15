import { useState } from "react";
import { SettingsHeader } from "./settings-header";
import {
  HvRefreshCw,
  HvCheckCircle,
  HvAlertCircle,
  HvClock,
} from "@/modules/icons";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useCombinedDateFormat } from "@/modules/calendar/use-combined-date-format";
import { useSync } from "@/modules/sync/context";

export default function Sync() {
  const { t } = useLanguageContext();
  const { formatCombinedDate } = useCombinedDateFormat();
  const { lastSyncTime, isSyncing, manualSync, isManualSyncing, canSync } =
    useSync();
  const [manualSyncStatus, setManualSyncStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleManualSync = async () => {
    setManualSyncStatus("idle");
    setErrorMessage(undefined);

    try {
      // Trigger manual sync and update lastSyncTime
      await manualSync();
      setManualSyncStatus("success");
    } catch (error) {
      setManualSyncStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Sync failed");
    }
  };

  const formatLastSyncTime = (date: Date | null) => {
    if (!date) return t("never");

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("just_now");
    if (diffMins < 60) return t("minutes_ago", { count: diffMins });
    if (diffHours < 24) return t("hours_ago", { count: diffHours });
    if (diffDays < 7) return t("days_ago", { count: diffDays });

    return formatCombinedDate(date, { includeYear: true });
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return (
        <HvRefreshCw
          className="h-5 w-5 animate-spin"
          style={{ color: "var(--hvsna-primary-color)" }}
        />
      );
    }

    if (manualSyncStatus === "success") {
      return (
        <HvCheckCircle
          className="h-5 w-5"
          style={{ color: "var(--hvsna-primary-color)" }}
        />
      );
    }

    if (manualSyncStatus === "error") {
      return <HvAlertCircle className="h-5 w-5 text-red-600" />;
    }

    if (lastSyncTime) {
      return (
        <HvCheckCircle
          className="h-5 w-5"
          style={{ color: "var(--hvsna-primary-color)" }}
        />
      );
    }

    return <HvClock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isSyncing) return t("auto_syncing");

    if (manualSyncStatus === "success") return t("sync_successful");
    if (manualSyncStatus === "error") return t("sync_failed");

    if (lastSyncTime) return t("sync_successful");

    return t("sync_idle");
  };

  return (
    <>
      <SettingsHeader title={t("sync")} description={t("sync_description")} />
      <div className="space-y-6">
        {/* Error Message Section */}
        {manualSyncStatus === "error" && errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <HvAlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  {t("sync_failed")}
                </h3>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status Card */}
        <div className="rounded-lg border-gray-200 border p-6 bg-white">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t("last_sync")}:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatLastSyncTime(lastSyncTime)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t("status")}:</span>
              <span
                className={`flex items-center gap-1.5 text-sm font-medium ${
                  isSyncing
                    ? ""
                    : manualSyncStatus === "success" ||
                        (lastSyncTime && manualSyncStatus === "idle")
                      ? "text-green-600"
                      : manualSyncStatus === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                }`}
                style={
                  isSyncing
                    ? { color: "var(--hvsna-primary-color)" }
                    : undefined
                }
              >
                {getStatusIcon()}
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Manual Sync Button */}
        <button
          onClick={handleManualSync}
          disabled={isManualSyncing || !canSync}
          className={`text-sm w-full md:w-fit px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 border ${
            isManualSyncing || !canSync
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
              : "text-white hover:opacity-90"
          }`}
          style={{
            backgroundColor:
              isManualSyncing || !canSync
                ? undefined
                : "var(--hvsna-primary-color)",
            borderColor:
              isManualSyncing || !canSync
                ? undefined
                : "var(--hvsna-primary-color)",
          }}
        >
          {isManualSyncing ? (
            <>
              <HvRefreshCw className="h-4 w-4 animate-spin" />
              {t("syncing")}
            </>
          ) : (
            <>
              <HvRefreshCw className="h-4 w-4" />
              {t("sync_now")}
            </>
          )}
        </button>
      </div>
    </>
  );
}
