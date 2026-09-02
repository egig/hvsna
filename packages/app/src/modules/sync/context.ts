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
import { useRepositories } from "@/modules/repositories-context";
import { getSyncApiClient } from "@/infra/sync/SyncApiClientFactory";
import { createSyncEngine, type SyncEngine } from "./sync-engine";
import { getLastSuccessAt } from "./cursor-store";

const POLL_INTERVAL_MS = 30_000;
const WRITE_DEBOUNCE_MS = 1_500;

// Database Context
export type SyncContextType = {
  replication: any | null;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  isManualSyncing: boolean;
  initialSyncPerformed: boolean;
  canSync: boolean;
  manualSync: () => Promise<void>;
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
 * Sync runs on five triggers: the manual "Sync now" button, the network
 * coming back online while signed in, being able to sync without an initial
 * sync yet on the clock (sign-in, or a reload where the pre-render
 * bootstrap in modules/bootstrap.ts couldn't complete the sync itself — so
 * a fresh device still pulls its data without the user clicking anything), a
 * 30s poll while the tab is visible and signed in (mirrors Android's periodic
 * WorkManager sync,
 * but on a much tighter interval since the web app has no OS-level floor),
 * and a local write anywhere in the app — debounced ~1.5s so a burst of
 * edits (typing a task name, reordering several tasks) collapses into one
 * sync instead of one per keystroke. The poll and write-trigger both run
 * silently — they don't flip isSyncing — so they don't flicker the UI every
 * tick; they only surface via lastSyncTime / query invalidation when a pull
 * actually applies something.
 */
export const SyncProvider = ({
  children,
  initialSync,
}: {
  children: ReactNode;
  /** Seeded from modules/bootstrap.ts: whether the pre-render initial sync
   *  actually completed, and the last-success timestamp read from local
   *  state. Lets the provider skip re-running a sync bootstrap already did. */
  initialSync?: { performed: boolean; lastSyncAt: Date | null };
}) => {
  const { client } = useSqliteClient();
  const { isOnline } = useNetworkContext();
  const { isAuthenticated, user } = useAuth();
  const { writeNotifier } = useRepositories();
  // Signed in isn't enough — the API rejects /sync/push and /sync/pull with
  // 403 EMAIL_NOT_VERIFIED until the user confirms their address, so every
  // auto-trigger gates on this too (matching that server-side check) rather
  // than firing requests that are guaranteed to fail.
  const canSync = isAuthenticated && !!user?.emailVerified;
  const invalidateTaskQueries = useInvalidateTaskQueries();
  const settingsRepo = useSettingsRepository();
  const { setSettings } = useSettings();

  const engineRef = useRef<SyncEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createSyncEngine(client, getSyncApiClient());
  }

  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(
    initialSync?.lastSyncAt ?? null
  );
  const [initialSyncPerformed, setInitialSyncPerformed] = useState(
    initialSync?.performed ?? false
  );

  // Coalesces overlapping trigger calls: a sync already in flight schedules
  // one more pass instead of running concurrently or being dropped.
  const inFlightRef = useRef(false);
  const rerunRef = useRef(false);

  useEffect(() => {
    getLastSuccessAt(client)
      .then(setLastSyncTime)
      .catch(() => {});
  }, [client]);

  const runSync = async (silent = false): Promise<boolean> => {
    if (inFlightRef.current) {
      rerunRef.current = true;
      return false;
    }
    inFlightRef.current = true;
    if (!silent) setIsSyncing(true);
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
      if (!silent) setIsSyncing(false);
    }
  };

  const manualSync = async (): Promise<void> => {
    if (!canSync) {
      throw new Error("Verify your email before syncing");
    }
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

  // Trigger: network reconnect while signed in and verified.
  const wasOnlineRef = useRef(isOnline);
  useEffect(() => {
    const cameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;
    if (cameOnline && canSync) backgroundSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, canSync]);

  // Trigger: able to sync but no initial sync has happened yet. Covers
  // sign-in mid-session, verifying the email, and a reload where the
  // pre-render bootstrap (modules/bootstrap.ts) couldn't finish the sync
  // itself (offline, timed out, session not yet restorable). When bootstrap
  // did complete it, initialSyncPerformed starts true and this is a no-op.
  // Gated on a verified account — an unverified user has nothing to pull.
  useEffect(() => {
    if (canSync && !initialSyncPerformed) backgroundSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, initialSyncPerformed]);

  // Trigger: 30s poll while the tab is visible, once the initial sync has
  // run. Silent (doesn't flip isSyncing) — see the block comment above.
  useEffect(() => {
    if (!initialSyncPerformed || !canSync) return;

    const pollTick = () => {
      if (document.visibilityState !== "visible") return;
      runSync(true).catch((error) => {
        console.error("Poll sync failed:", error);
      });
    };
    const intervalId = setInterval(pollTick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", pollTick);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", pollTick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSyncPerformed, canSync]);

  // Trigger: a local write anywhere in the app, debounced ~1.5s so a burst
  // of edits collapses into one sync instead of one per write. Skipped while
  // offline — the reconnect trigger above catches up once connectivity
  // returns. Silent, like the poll — see the block comment above.
  useEffect(() => {
    if (!canSync) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = writeNotifier.subscribe(() => {
      if (!isOnline) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        runSync(true).catch((error) => {
          console.error("Write-triggered sync failed:", error);
        });
      }, WRITE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, isOnline, writeNotifier]);

  const value: SyncContextType = {
    replication: null,
    lastSyncTime,
    isSyncing,
    isManualSyncing,
    initialSyncPerformed,
    canSync,
    manualSync,
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
