import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import PouchDB from "pouchdb";
import { usePouchDB } from "../.client/contexts/PouchDB";
import { useSession } from "@clerk/clerk-react";
import type { Note } from "./types/note";

export default async function sync(
  localDb: PouchDB.Database,
  remoteUrl: string,
  userID: string,
) {
  const remoteDb = new PouchDB(remoteUrl, {
    auth: {
      username: userID,
      password: '', // Will be set with proper auth token
    },
  });

  const replication = PouchDB.sync(localDb, remoteDb, {
    live: true,
    retry: true,
    filter: function (doc: any) {
      return doc.user_id === userID;
    },
  });

  return replication;
}

// Database Context
type SyncContextType = {
  replication: any | null;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children, couchUrl }: { children: ReactNode, couchUrl: string }) => {
  const { db } = usePouchDB();
  const { session } = useSession();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [replication, setReplication] =
    useState<any | null>(null);

  useEffect(() => {
    const initializeSync = async () => {
      if (!!db && session?.user?.id && !syncInitialized && couchUrl) {
        try {
          const r = sync(db, `${couchUrl}/notes`, session?.user?.id);
          setReplication(r);
          setSyncInitialized(true);
          
          // Handle sync events
          r.then((syncResult: any) => {
            syncResult.on('change', (info: any) => {
              console.log('[sync] change:', info);
            });
            
            syncResult.on('paused', (err: any) => {
              console.log('[sync] paused:', err);
            });
            
            syncResult.on('active', () => {
              console.log('[sync] active');
            });
            
            syncResult.on('denied', (err: any) => {
              console.error('[sync] denied:', err);
            });
            
            syncResult.on('complete', (info: any) => {
              console.log('[sync] complete:', info);
            });
            
            syncResult.on('error', (err: any) => {
              console.error('[sync] error:', err);
            });
          });
        } catch (error) {
          console.error("sync error", error);
        }
      }
    };

    initializeSync();
  }, [db, session?.user?.id, syncInitialized, couchUrl]);

  return React.createElement(
    SyncContext.Provider,
    { value: { replication: replication } },
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
