import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePouchDB } from "../pouchdb";
import { useAuth } from "src/modules/auth/use-auth";
import { useSession } from "@clerk/clerk-react";
import PouchDB from "pouchdb";

// Database Context
type SyncContextType = {
  replication: any | null;
  lastSyncTime: Date | null;
  isSyncing: boolean;
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

      if (!syncInitialized) {
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
            .on("change", (info: any) => {
              console.log("[sync] change:", info);
              setLastSyncTime(new Date());
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
            .on("complete", (info: any) => {
              console.log("[sync] complete:", info);
              setLastSyncTime(new Date());
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
      }
    };

    if (!!db && !!isSignedIn && !!user) {
      initializeSync();
    }
  }, [db, isSignedIn, user, session]);

  return React.createElement(
    SyncContext.Provider,
    { value: { replication, lastSyncTime, isSyncing } },
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
