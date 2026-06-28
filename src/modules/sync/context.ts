import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/modules/auth/use-auth";
import PouchDB from "pouchdb";
import { usePouchDB } from "@/pouchdb";
import { useQueryClient } from "@tanstack/react-query";
import { SyncInitDialog } from "./components/sync-init-dialog";
import {
  hasSyncedBefore,
  markAsSynced,
  getLocalDocCount,
  isDatabaseEmpty,
  deleteAllLocalDocs,
} from "./utils/sync-state";
import { getTokenStore } from "../../infra/auth/AuthServiceFactory";
import log from "../logger";
import { useNetworkContext } from "../network/context";

// Helper functions for syncTime persistence
interface SyncTimeDocument {
  _id: string;
  _rev?: string;
  lastSyncTime: string;
}

const getSyncTimeFromDB = async (
  db: PouchDB.Database
): Promise<Date | null> => {
  try {
    const doc = (await db.get("_local/syncTime")) as SyncTimeDocument;
    return doc.lastSyncTime ? new Date(doc.lastSyncTime) : null;
  } catch (error) {
    // Document doesn't exist yet, return null
    return null;
  }
};

const storeSyncTimeToDB = async (
  db: PouchDB.Database,
  syncTime: Date
): Promise<void> => {
  try {
    const doc = (await db
      .get("_local/syncTime")
      .catch(() => null)) as SyncTimeDocument | null;

    if (doc) {
      // Update existing document
      await db.put({
        ...doc,
        lastSyncTime: syncTime.toISOString(),
      });
    } else {
      // Create new document
      await db.put({
        _id: "_local/syncTime",
        lastSyncTime: syncTime.toISOString(),
      });    }
  } catch (error) {
    console.error("[sync] Failed to store syncTime:", error);
  }
};

// Database Context
type SyncContextType = {
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
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { db } = usePouchDB();
  const { user, isAuthenticated } = useAuth();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [replication, setReplication] = useState<any | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [initialSyncPerformed, setInitialSyncPerformed] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [localDocCount, setLocalDocCount] = useState(0);
  const [hasCheckedSyncState, setHasCheckedSyncState] = useState(false);
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkContext();

  // Reusable function to check if sync conditions are met
  const canSync = useCallback((): boolean => {
    return !!(isAuthenticated && user && user.syncURL && db && isOnline);
  }, [isAuthenticated, user, db, isOnline]);

  // Manual sync function
  const manualSync = async () => {
    if (!canSync()) {
      throw new Error(
        "Sync not available - user not signed in, sync URL not configured, or network offline"
      );
    }

    log.info("[sync] Manual sync started");
    try {
      setIsManualSyncing(true);

      const token = getTokenStore().getAccessToken();

      const remoteDB = new PouchDB(user!.syncURL, {
        fetch: function (url: string | Request, options: any) {
          if (token) {
            options.headers.set("Authorization", `Bearer ${token}`);
          }
          return PouchDB.fetch(url, options);
        },
      });

      // Perform one-time sync
      await db.sync(remoteDB);

      // Invalidate all queries so UI reflects synced data
      queryClient.invalidateQueries();

      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      await storeSyncTimeToDB(db, now);
    } catch (error) {
      console.error("[sync] Manual sync failed:", error);
      throw error;
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Handle merge sync option
  const handleSyncMerge = async () => {
    if (!db) return;

    try {
      log.info("[sync] User chose merge option");
      setIsManualSyncing(true);

      // Perform sync (merge is default behavior)
      await manualSync();

      // Mark as synced
      await markAsSynced(db, "merge");

      // Close dialog
      setShowSyncDialog(false);

      log.info("[sync] Merge sync completed successfully");
    } catch (error) {
      log.error("[sync] Merge sync failed:", error);
      throw error;
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Handle delete local data option
  const handleSyncDeleteLocal = async () => {
    if (!db) return;

    try {
      log.info("[sync] User chose delete local data option");
      setIsManualSyncing(true);

      // Delete all local documents
      await deleteAllLocalDocs(db);

      // Perform sync to get fresh data from remote
      await manualSync();

      // Mark as synced
      await markAsSynced(db, "delete-local");

      // Close dialog
      setShowSyncDialog(false);

      // Update local doc count
      setLocalDocCount(0);

      log.info("[sync] Delete local sync completed successfully");
    } catch (error) {
      log.error("[sync] Delete local sync failed:", error);
      throw error;
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Close sync dialog
  const closeSyncDialog = () => {
    setShowSyncDialog(false);
    log.info("[sync] Sync dialog closed by user");
  };

  // Load syncTime from DB on component mount
  useEffect(() => {
    const loadSyncTime = async () => {
      if (db) {
        const storedSyncTime = await getSyncTimeFromDB(db);
        setLastSyncTime(storedSyncTime);
      }
    };

    loadSyncTime();
  }, [db]);

  // Check sync state and local document count
  useEffect(() => {
    const checkSyncState = async () => {
      if (!db || hasCheckedSyncState) return;

      try {
        const [hasSynced, docCount] = await Promise.all([
          hasSyncedBefore(db),
          getLocalDocCount(db),
        ]);

        setLocalDocCount(docCount);
        setHasCheckedSyncState(true);

        log.info(
          `[sync] Database state: hasSynced=${hasSynced}, docCount=${docCount}`
        );

        // Show dialog if database has data but hasn't been synced before
        if (!hasSynced && docCount > 0 && isAuthenticated && user?.syncURL) {
          setShowSyncDialog(true);
          log.info("[sync] Showing sync initialization dialog");
        }
      } catch (error) {
        log.error("[sync] Failed to check sync state:", error);
        setHasCheckedSyncState(true);
      }
    };

    checkSyncState();
  }, [db, hasCheckedSyncState, isAuthenticated, user]);

  // Pause/resume sync based on network status
  useEffect(() => {
    if (replication) {
      if (isOnline) {
        // Resume sync when coming back online
        log.info("[sync] Network available - continuing sync");
        // Trigger a manual sync to ensure data is synced when back online
        manualSync().catch((error) => {
          log.warn("[sync] Auto-sync on network resume failed:", error);
        });
      } else {
        // Pause sync when going offline
        log.info("[sync] Network unavailable - pausing sync");
        // PouchDB automatically handles pausing when offline,
        // but we can ensure sync state is reflected
        setIsSyncing(false);
      }
    }
  }, [isOnline, replication]);

  // Tab visibility monitoring - trigger manual sync when tab becomes visible
  useEffect(() => {
    if (!canSync()) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        log.info("[sync] Tab became visible - triggering manual sync");
        manualSync().catch((error) => {
          log.warn("[sync] Auto-sync on tab visibility failed:", error);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canSync]);

  // Perform initial sync on first load when conditions are met
  useEffect(() => {
    const performInitialSync = async () => {
      // Only perform initial sync if:
      // 1. User is authenticated
      // 2. Sync URL is available
      // 3. Database is available
      // 4. Network is online
      // 5. Initial sync hasn't been performed yet
      // 6. Sync state has been checked (to avoid showing dialog conflicts)
      if (
        isAuthenticated &&
        user?.syncURL &&
        db &&
        isOnline &&
        !initialSyncPerformed &&
        hasCheckedSyncState
      ) {
        // Check if database has been synced before
        const hasSynced = await hasSyncedBefore(db);

        if (hasSynced) {
          log.info("[sync] Performing initial sync on first load");
          try {
            await manualSync();
            setInitialSyncPerformed(true);
            log.info("[sync] Initial sync completed successfully");
          } catch (error) {
            log.error("[sync] Initial sync failed:", error);
            // Don't set initialSyncPerformed to true on failure, so it can retry
          }
        } else {
          // If not synced before, check if database is empty
          const isEmpty = await isDatabaseEmpty(db);
          if (isEmpty) {
            log.info("[sync] Database is empty, performing initial sync");
            try {
              await manualSync();
              setInitialSyncPerformed(true);
              await markAsSynced(db, "merge"); // Default to merge for empty DB
              log.info(
                "[sync] Initial sync for empty DB completed successfully"
              );
            } catch (error) {
              log.error("[sync] Initial sync for empty DB failed:", error);
            }
          } else {
            // Database has data but hasn't been synced - dialog will be shown
            log.info(
              "[sync] Database has unsynced data, waiting for user choice"
            );
            setInitialSyncPerformed(true); // Don't auto-sync, wait for dialog
          }
        }
      }
    };

    performInitialSync();
  }, [
    isAuthenticated,
    user,
    db,
    isOnline,
    initialSyncPerformed,
    hasCheckedSyncState,
  ]);

  useEffect(() => {
    const initializeSync = async () => {
      if (!canSync()) {
        if (replication) {
          replication.cancel();
          setReplication(null);
          setSyncInitialized(false);
        }
        return;
      }

      if (syncInitialized) {
        return;
      }

      try {
        setIsSyncing(true);
        setSyncInitialized(true);

        const token = getTokenStore().getAccessToken();

        const remoteDB = new PouchDB(user!.syncURL, {
          fetch: function (url: string | Request, options: any) {
            if (token) {
              options.headers.set("Authorization", `Bearer ${token}`);
            }
            return PouchDB.fetch(url, options);
          },
        });

        const syncReplication = db
          .sync(remoteDB, {
            live: true,
            retry: true,
          })
          .on("change", async (info: any) => {
            log.info("[sync] change:", info);
            // Changes are actively being replicated.
            setIsSyncing(true);
            queryClient.invalidateQueries();
            const now = new Date();
            setLastSyncTime(now);
            await storeSyncTimeToDB(db, now);
          })
          .on("paused", (err: any) => {
            log.info("[sync] paused:", err);
            // Replication caught up (or paused) — no longer actively syncing.
            setIsSyncing(false);
          })
          .on("active", () => {
            log.info("[sync] active");
            // Replication resumed transferring changes.
            setIsSyncing(true);
          })
          .on("denied", (err: any) => {
            console.error("[sync] denied:", err);
          })
          .on("complete", async (info: any) => {
            log.info("[sync] complete:", info);
            setIsSyncing(false);
            const now = new Date();
            setLastSyncTime(now);
            await storeSyncTimeToDB(db, now);
          })
          .on("error", (err: any) => {
            console.error("[sync] error:", err);
            setIsSyncing(false);
          });

        // Store the replication reference for cleanup
        setReplication(syncReplication);
      } catch (error) {
        log.error("sync error", error);
        setIsSyncing(false);
      }
    };

    if (canSync()) {
      initializeSync();
    }
  }, [db, canSync]);

  return React.createElement(
    SyncContext.Provider,
    {
      value: {
        replication,
        lastSyncTime,
        isSyncing,
        isManualSyncing,
        initialSyncPerformed,
        showSyncDialog,
        localDocCount,
        manualSync,
        handleSyncMerge,
        handleSyncDeleteLocal,
        closeSyncDialog,
      },
    },
    React.createElement(
      React.Fragment,
      null,
      children,
      React.createElement(SyncInitDialog, {
        isOpen: showSyncDialog,
        onClose: closeSyncDialog,
        onMerge: handleSyncMerge,
        onDeleteLocal: handleSyncDeleteLocal,
        localDocCount: localDocCount,
      })
    )
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
