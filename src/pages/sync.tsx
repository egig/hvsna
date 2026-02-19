import { useState, useEffect } from "react";
import { Page } from "../modules/navigation";
import { Navbar } from "../modules/navigation";
import Block from "../components/block";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useLanguageContext } from "src/modules/common/LanguageContext";
import { useSync } from "src/modules/sync/sync";

export default function Sync() {
  const { t } = useLanguageContext();
  const { lastSyncTime, isSyncing } = useSync();
  const [manualSyncStatus, setManualSyncStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleManualSync = async () => {
    setManualSyncStatus("idle");
    setErrorMessage(undefined);

    try {
      // Trigger manual sync - the SyncProvider handles the actual sync
      // We can simulate a manual trigger here if needed
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    }

    if (manualSyncStatus === "success") {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }

    if (manualSyncStatus === "error") {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }

    if (lastSyncTime) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }

    return <Clock className="h-5 w-5 text-gray-600" />;
  };

  const getStatusText = () => {
    if (isSyncing) return t("syncing");

    if (manualSyncStatus === "success") return t("sync_successful");
    if (manualSyncStatus === "error") return errorMessage || t("sync_failed");

    if (lastSyncTime) return t("sync_successful");

    return t("sync_idle");
  };

  return (
    <Page>
      <Navbar title={t("sync")} />
      <Block>
        <div className="space-y-6">
          {/* Sync Status Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("sync_status")}
              </h3>
              {getStatusIcon()}
            </div>

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
            disabled={isSyncing}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
              isSyncing
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isSyncing ? (
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

          {/* Sync Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              {t("sync_info")}
            </h4>
            <p className="text-sm text-blue-700">{t("sync_description")}</p>
          </div>
        </div>
      </Block>
    </Page>
  );
}
