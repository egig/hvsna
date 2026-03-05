import { useState, useEffect } from "react";
import { Page } from "../navigation";
import { Navbar } from "../navigation";
import Block from "../../ui/block";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Info } from "lucide-react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useSync } from "src/modules/sync/context";

export default function Sync() {
  const { t } = useLanguageContext();
  const { lastSyncTime, isSyncing, manualSync, isManualSyncing } = useSync();
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

    return date.toLocaleDateString();
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return (
        <span
          className="text-sm font-medium"
          style={{ color: "var(--hvsna-primary-color)" }}
        >
          {t("auto_syncing")}
        </span>
      );
    }

    if (manualSyncStatus === "success") {
      return (
        <CheckCircle
          className="h-5 w-5"
          style={{ color: "var(--hvsna-primary-color)" }}
        />
      );
    }

    if (manualSyncStatus === "error") {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }

    if (lastSyncTime) {
      return (
        <CheckCircle
          className="h-5 w-5"
          style={{ color: "var(--hvsna-primary-color)" }}
        />
      );
    }

    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isSyncing) return t("auto_syncing");

    if (manualSyncStatus === "success") return t("sync_successful");
    if (manualSyncStatus === "error") return t("sync_failed");

    if (lastSyncTime) return t("sync_successful");

    return t("sync_idle");
  };

  return (
    <Page>
      <Navbar title={t("sync")} />
      <Block>
        <div className="space-y-6">
          {/* Error Message Section */}
          {manualSyncStatus === "error" && errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    {t("sync_failed")}
                  </h3>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg p-4 bg-gray-200">
            <p className="text-sm text-gray-600">{t("sync_description")}</p>
          </div>

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
                  className={`text-sm font-medium ${
                    manualSyncStatus === "success" ||
                    (lastSyncTime && manualSyncStatus === "idle")
                      ? "text-green-600"
                      : manualSyncStatus === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 border ${
              isManualSyncing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                : "text-white hover:opacity-90"
            }`}
            style={{
              backgroundColor: isManualSyncing
                ? undefined
                : "var(--hvsna-primary-color)",
              borderColor: isManualSyncing
                ? undefined
                : "var(--hvsna-primary-color)",
            }}
          >
            {isManualSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("syncing")}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {t("sync_now")}
              </>
            )}
          </button>
        </div>
      </Block>
    </Page>
  );
}
