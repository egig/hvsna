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

  const icon = isSyncing || isManualSyncing
  ? <HvRefreshCw size={20} className="animate-spin" />
  : lastSyncTime
    ? <HvCloudCheck size={24} />
    : <HvCloudOff size={24} />;

return (
  <div className={`${badgeClass} text-gray-500 border-none`}>
    {icon}
  </div>
);
}
