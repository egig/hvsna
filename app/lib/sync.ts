import type { SupabaseClient } from "@supabase/supabase-js";
import { replicateSupabase } from "rxdb/plugins/replication-supabase";

export default async function sync(s: SupabaseClient, collection: any, userID: string) {
  const replication = replicateSupabase({
    tableName: "notes",
    client: s,
    collection: collection,
    replicationIdentifier: "notes-supabase",
    live: true,
    pull: {
      batchSize: 50,
      modifier: (doc) => {
        return doc;
      },
      queryBuilder: ({ query }) => {
        return query.eq("user_id", userID).select("id");
      },
    },
    push: {
      batchSize: 50,
      modifier: (doc) => {
        return doc
      },
    },
    modifiedField: 'updated_at',
    deletedField: '_deleted'
  });

  // (optional) observe errors and wait for the first sync barrier
  replication.error$.subscribe((err) => console.error("[replication]", err));
  replication.sent$.subscribe(doc => console.log("[sent]", doc));
  await replication.awaitInitialReplication();
}
