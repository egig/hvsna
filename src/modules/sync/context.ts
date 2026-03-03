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
  const queryClient = useQueryClient();

  // Manual sync function
  const manualSync = async () => {
    console.log(isSignedIn, user, db);
    if (!isSignedIn || !user?.syncURL || !db) {
      throw new Error(
        "Sync not available - user not signed in or sync URL not configured",
      );
    }

    console.log("[sync] Manual sync started");
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
            console.log("[sync] change:", info);
            queryClient.invalidateQueries();
            const now = new Date();
            setLastSyncTime(now);
            await storeSyncTimeToDB(db, now);
          })
          .on("paused", (err: any) => {
            console.log("[sync] paused:", err);
            // setIsSyncing(false);
          })
          .on("active", () => {
            console.log("[sync] active");
            // setIsSyncing(true);
          })
          .on("denied", (err: any) => {
            console.error("[sync] denied:", err);
            // setIsSyncing(false);
          })
          .on("complete", async (info: any) => {
            console.log("[sync] complete:", info);
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
  }, [db, isSignedIn, user, session]);

  return React.createElement(
    SyncContext.Provider,
    {
      value: {
        replication,
        lastSyncTime,
        isSyncing,
        isManualSyncing,
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
