import { useSync } from "../context";
import { useNetworkContext } from "../../network/context";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { HvRefreshCw, HvCloudOff, HvCloudCheck } from "@/modules/icons";
import { useAuth } from "@/modules/auth";

const badgeClass =
  "inline-flex items-center gap-1 text-sm px-1.5 mr-3 rounded-sm border-1";

export function SyncStatusBadge() {
  const { t } = useLanguageContext();
  const { isOnline, initiated: networkInit } = useNetworkContext();
  const { isSyncing, lastSyncTime, syncUnavailable } = useSync();
  const {isAuthenticated} = useAuth()

  if (!networkInit) {
    return null
  }

  if (syncUnavailable) {
    return (
      <div className={`${badgeClass} text-gray-400 border-gray-300`}>
        {t("sync_coming_soon")}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`${badgeClass} text-gray-500 border-gray-300`}>
        {t("offline")}
      </div>
    );
  }

  let icon = <HvCloudOff size={24} />;
  if (isAuthenticated) {
    if (isSyncing) {
      icon = <HvRefreshCw size={20} className="animate-spin" />;
    }

    if (lastSyncTime) {
      icon = <HvCloudCheck size={24} />;
    }
  }

return (
  <div className={`${badgeClass} text-gray-500 border-none`}>
    {icon}
  </div>
);
}
