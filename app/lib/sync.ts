import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { RxReplicationState } from "rxdb/plugins/replication";
import {
  replicateSupabase,
  RxSupabaseReplicationState,
} from "rxdb/plugins/replication-supabase";
import { useDatabase } from "./database";
import { useSession } from "@clerk/clerk-react";

export default async function sync(
  s: SupabaseClient,
  collection: any,
  userID: string,
) {
  const replication = replicateSupabase({
    tableName: "notes",
    client: s,
    collection: collection,
    replicationIdentifier: "notes-supabase",
    live: true,
    pull: {
      batchSize: 50,
      queryBuilder: ({ query }) => {
        return query.eq("user_id", userID);
      },
    },
    push: {
      batchSize: 50,
    },
    modifiedField: "updated_at",
    deletedField: "_deleted",
  });

  // (optional) observe errors and wait for the first sync barrier
  // replication.error$.subscribe((err) => console.error("[replication]", err));
  // replication.sent$.subscribe(doc => console.log("[sent]", doc));
  await replication.awaitInitialReplication();
  return replication;
}

// Database Context
type SyncContextType = {
  replication: RxReplicationState<any, any> | null;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider = ({ children, url, publishableKey }: { children: ReactNode, url: string, publishableKey: string }) => {
  const { db } = useDatabase();
  const { session } = useSession();
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [replication, setReplication] =
    useState<RxSupabaseReplicationState<any> | null>(null);

  // TODO move env to entry
  const sClient = createClient(
    url,
    publishableKey,
    {
      accessToken: () => session?.getToken() ?? Promise.resolve(null),
    },
  );

  useEffect(() => {
    const initializeSync = async () => {
      if (!!db && session?.user?.id && !syncInitialized) {
        try {
          const r = await sync(sClient, db?.notes, session?.user?.id);
          setReplication(r);
          setSyncInitialized(true);
        } catch (error) {
          console.error("sync error", error);
        }
      }
    };

    // TODO
    // initializeSync();
  }, [db, session?.user?.id, syncInitialized, sClient]);

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
