import { useSync } from "../context";
import { useNetworkContext } from "../../network/context";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { HvRefreshCw, HvCloudOff, HvCloudCheck } from "@/modules/icons";

const badgeClass =
  "inline-flex items-center gap-1 text-sm px-1.5 mr-3 rounded-sm border-1";

export function SyncStatusBadge() {
  const { t } = useLanguageContext();
  const { isOnline, initiated: networkInit } = useNetworkContext();
  const { isSyncing, isManualSyncing, lastSyncTime } = useSync();

  // Offline takes precedence — nothing can sync while offline.
  if (!isOnline && networkInit) {
    return (
      <div className={`${badgeClass} text-gray-500 border-gray-300`}>
        {t("offline")}
      </div>
    );
  }

  if (isSyncing || isManualSyncing) {
    return (
      <div className={`${badgeClass} text-gray-500 border-none`}>
        <HvRefreshCw size={20} className="animate-spin" />
      </div>
    );
  }

  // Only show the synced state once a sync has actually happened.
  if (lastSyncTime) {
    return (
      <div className={`${badgeClass} text-gray-500 border-note` }>
        <HvCloudCheck size={24} />
      </div>
    );
  }

   return (
      <div className={`${badgeClass} text-gray-500 border-none`}>
        <HvCloudOff size={24} />
      </div>
    );
}
