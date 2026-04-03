import PouchDB from "pouchdb";
import log from "src/modules/logger";

export interface SyncStateDocument {
  _id: string;
  _rev?: string;
  hasSyncedBefore: boolean;
  syncInitializedAt?: string;
  lastSyncStrategy?: "merge" | "delete-local";
}

const SYNC_STATE_DOC_ID = "_local/syncState";

/**
 * Check if database has been synced before
 */
export const hasSyncedBefore = async (
  db: PouchDB.Database,
): Promise<boolean> => {
  try {
    const doc = (await db.get(SYNC_STATE_DOC_ID)) as SyncStateDocument;
    return doc.hasSyncedBefore;
  } catch (error) {
    // Document doesn't exist, return false
    return false;
  }
};

/**
 * Mark database as synced
 */
export const markAsSynced = async (
  db: PouchDB.Database,
  strategy: "merge" | "delete-local",
): Promise<void> => {
  try {
    const doc = (await db
      .get(SYNC_STATE_DOC_ID)
      .catch(() => null)) as SyncStateDocument | null;

    const syncState: SyncStateDocument = {
      _id: SYNC_STATE_DOC_ID,
      hasSyncedBefore: true,
      syncInitializedAt: new Date().toISOString(),
      lastSyncStrategy: strategy,
      ...(doc && { _rev: doc._rev }),
    };

    await db.put(syncState);
    log.info(`[sync] Database marked as synced with strategy: ${strategy}`);
  } catch (error) {
    log.error("[sync] Failed to mark database as synced:", error);
    throw error;
  }
};

/**
 * Get local document count
 */
export const getLocalDocCount = async (
  db: PouchDB.Database,
): Promise<number> => {
  try {
    const result = await db.allDocs({
      include_docs: false,
    });

    // Filter out local documents that start with _local
    const nonLocalDocs = result.rows.filter(
      (row) => !row.id.startsWith("_local/"),
    );

    return nonLocalDocs.length;
  } catch (error) {
    log.error("[sync] Failed to get local document count:", error);
    return 0;
  }
};

/**
 * Check if database is empty
 */
export const isDatabaseEmpty = async (
  db: PouchDB.Database,
): Promise<boolean> => {
  const count = await getLocalDocCount(db);
  return count === 0;
};

/**
 * Delete all local documents (excluding design and local docs)
 */
export const deleteAllLocalDocs = async (
  db: PouchDB.Database,
): Promise<void> => {
  try {
    const result = await db.allDocs({
      include_docs: true,
    });

    // Filter out local documents that start with _local
    const docsToDelete = result.rows.filter(
      (row) => !row.id.startsWith("_local/"),
    );

    if (docsToDelete.length === 0) {
      log.info("[sync] No local documents to delete");
      return;
    }

    // Delete all documents in batches
    const batchSize = 100;
    for (let i = 0; i < docsToDelete.length; i += batchSize) {
      const batch = docsToDelete.slice(i, i + batchSize);
      const deleteDocs = batch.map((row) => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true,
      }));

      await db.bulkDocs(deleteDocs);
    }

    log.info(`[sync] Deleted ${docsToDelete.length} local documents`);
  } catch (error) {
    log.error("[sync] Failed to delete local documents:", error);
    throw error;
  }
};
