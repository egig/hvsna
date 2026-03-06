import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "src/modules/auth/use-auth";
import { useSession } from "@clerk/clerk-react";
import PouchDB from "pouchdb";
import { usePouchDB } from "src/pouchdb";
import { useQueryClient } from "@tanstack/react-query";
import { CapacitorNetwork } from "src/lib/capacitor/network";
import log from "../../lib/logger";

// Helper functions for syncTime persistence
interface SyncTimeDocument {
  _id: string;
  _rev?: string;
  lastSyncTime: string;
}

const getSyncTimeFromDB = async (
  db: PouchDB.Database,
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
  syncTime: Date,
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
      });
    }
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
  isOnline: boolean;
  manualSync: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { db } = usePouchDB();
  const { user, isSignedIn } = useAuth();
  const { session } = useSession();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [replication, setReplication] = useState<any | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  // Manual sync function
  const manualSync = async () => {
    log.info(isSignedIn, user, db);
    if (!isSignedIn || !user?.syncURL || !db) {
      throw new Error(
        "Sync not available - user not signed in or sync URL not configured",
      );
    }

    if (!isOnline) {
      throw new Error("Sync not available - network offline");
    }

    log.info("[sync] Manual sync started");
    try {
      setIsManualSyncing(true);

      const token = await session?.getToken();

      const remoteDB = new PouchDB(user.syncURL, {
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

  // Network status monitoring
  useEffect(() => {
    let networkListener: any = null;

    const initializeNetworkMonitoring = async () => {
      try {
        // Get initial network status
        const status = await CapacitorNetwork.getStatus();
        setIsOnline(status.connected);

        // Add network status listener
        networkListener = await CapacitorNetwork.addListener(
          (networkStatus) => {
            log.info(
              `[sync] Network ${networkStatus.connected ? "online" : "offline"} - ${networkStatus.connectionType}`,
            );
            setIsOnline(networkStatus.connected);
          },
        );
      } catch (error) {
        console.error("[sync] Failed to initialize network monitoring:", error);
        // Fallback to browser API
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
          log.info("[sync] Network online - resuming sync");
          setIsOnline(true);
        };

        const handleOffline = () => {
          log.info("[sync] Network offline - pausing sync");
          setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Store fallback listeners for cleanup
        networkListener = {
          remove: async () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          },
        };
      }
    };

    initializeNetworkMonitoring();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

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

  useEffect(() => {
    const initializeSync = async () => {
      if (!isSignedIn || !user?.syncURL || !db) {
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

      // Don't initialize sync if offline
      if (!isOnline) {
        log.info("[sync] Offline - skipping sync initialization");
        return;
      }

      try {
        setIsSyncing(true);
        setSyncInitialized(true);

        const token = await session?.getToken();

        const remoteDB = new PouchDB(user.syncURL, {
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
            queryClient.invalidateQueries();
            const now = new Date();
            setLastSyncTime(now);
            await storeSyncTimeToDB(db, now);
          })
          .on("paused", (err: any) => {
            log.info("[sync] paused:", err);
            // setIsSyncing(false);
          })
          .on("active", () => {
            log.info("[sync] active");
            // setIsSyncing(true);
          })
          .on("denied", (err: any) => {
            console.error("[sync] denied:", err);
            // setIsSyncing(false);
          })
          .on("complete", async (info: any) => {
            log.info("[sync] complete:", info);
            const now = new Date();
            setLastSyncTime(now);
            await storeSyncTimeToDB(db, now);
            // setIsSyncing(false);
          })
          .on("error", (err: any) => {
            console.error("[sync] error:", err);
            // setIsSyncing(false);
          });

        // Store the replication reference for cleanup
        setReplication(syncReplication);
      } catch (error) {
        console.error("sync error", error);
        setIsSyncing(false);
      }
    };

    if (!!db && !!isSignedIn && !!user) {
      initializeSync();
    }
  }, [db, isSignedIn, user, session, isOnline]);

  return React.createElement(
    SyncContext.Provider,
    {
      value: {
        replication,
        lastSyncTime,
        isSyncing,
        isManualSyncing,
        isOnline,
        manualSync,
      },
    },
    children,
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};
