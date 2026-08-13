import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSqliteClient } from "@/modules/sqlite/context";
import { useNetworkContext } from "@/modules/network/context";
import { useAuth } from "@/modules/auth";
import { useSettings } from "@/modules/settings";
import { useSettingsRepository } from "@/modules/settings/use-settings-repository";
import { withDefaults } from "@/modules/settings/settings-defaults";
import { useInvalidateTaskQueries } from "@/modules/task/use-invalidate-task-queries";
import { getSyncApiClient } from "@/infra/sync/SyncApiClientFactory";
import { createSyncEngine, type SyncEngine } from "./sync-engine";
import { getLastSuccessAt } from "./cursor-store";

// Database Context
export type SyncContextType = {
  replication: any | null;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  isManualSyncing: boolean;
  initialSyncPerformed: boolean;
  showSyncDialog: boolean;
  localDocCount: number;
  manualSync: () => Promise<void>;
  handleSyncMerge: () => Promise<void>;
  handleSyncDeleteLocal: () => Promise<void>;
  closeSyncDialog: () => void;
  /** True while sync is not built yet. */
  syncUnavailable?: boolean;
};

export const SyncContext = createContext<SyncContextType | undefined>(
  undefined
);

/**
 * Reads dirty local rows, pushes them to packages/api, pulls what changed
 * server-side since this device's last cursor, and reconciles — see
 * modules/sync/sync-engine.ts for the actual push/pull/LWW logic this
 * provider just triggers and reports the status of.
 *
 * Sync runs on three triggers: the manual "Sync now" button, the network
 * coming back online while signed in, and signing in / reloading with a
 * still-valid session (so a fresh device actually pulls its data without
 * the user having to notice and click the button). No periodic polling —
 * there's no precedent for it elsewhere in the app and it's out of scope
 * for this pass.
 */
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { client } = useSqliteClient();
  const { isOnline } = useNetworkContext();
  const { isAuthenticated } = useAuth();
  const invalidateTaskQueries = useInvalidateTaskQueries();
  const settingsRepo = useSettingsRepository();
  const { setSettings } = useSettings();

  const engineRef = useRef<SyncEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createSyncEngine(client, getSyncApiClient());
  }

  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [initialSyncPerformed, setInitialSyncPerformed] = useState(false);

  // Coalesces overlapping trigger calls: a sync already in flight schedules
  // one more pass instead of running concurrently or being dropped.
  const inFlightRef = useRef(false);
  const rerunRef = useRef(false);

  useEffect(() => {
    getLastSuccessAt(client)
      .then(setLastSyncTime)
      .catch(() => {});
  }, [client]);

  const runSync = async (): Promise<boolean> => {
    if (inFlightRef.current) {
      rerunRef.current = true;
      return false;
    }
    inFlightRef.current = true;
    setIsSyncing(true);
    try {
      let applied = false;
      do {
        rerunRef.current = false;
        applied = (await engineRef.current!.fullSync()) || applied;
      } while (rerunRef.current);

      setLastSyncTime(new Date());
      setInitialSyncPerformed(true);
      if (applied) {
        invalidateTaskQueries();
        try {
          setSettings(withDefaults(await settingsRepo.load()));
        } catch {
          // best-effort — settings context just keeps its previous value
        }
      }
      return applied;
    } finally {
      inFlightRef.current = false;
      setIsSyncing(false);
    }
  };

  const manualSync = async (): Promise<void> => {
    setIsManualSyncing(true);
    try {
      await runSync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const backgroundSync = () => {
    runSync().catch((error) => {
      console.error("Background sync failed:", error);
    });
  };

  // Trigger: network reconnect while signed in.
  const wasOnlineRef = useRef(isOnline);
  useEffect(() => {
    const cameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;
    if (cameOnline && isAuthenticated) backgroundSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Trigger: sign-in, or app reload with a still-valid session.
  const wasAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    const justAuthenticated = !wasAuthenticatedRef.current && isAuthenticated;
    wasAuthenticatedRef.current = isAuthenticated;
    if (justAuthenticated) backgroundSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value: SyncContextType = {
    replication: null,
    lastSyncTime,
    isSyncing,
    isManualSyncing,
    initialSyncPerformed,
    showSyncDialog: false,
    localDocCount: 0,
    manualSync,
    handleSyncMerge: async () => {},
    handleSyncDeleteLocal: async () => {},
    closeSyncDialog: () => {},
  };

  return React.createElement(SyncContext.Provider, { value }, children);
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
