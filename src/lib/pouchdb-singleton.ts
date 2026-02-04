import PouchDB from "pouchdb";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(PouchDBFind);

let dbInstance: PouchDB.Database | null = null;
let indexesCreated = false;

/**
 * Get the singleton PouchDB instance
 * @param dbName - Optional database name (defaults to 'hvsna-notes')
 * @returns PouchDB.Database instance
 */
export const getPouchDBInstance = (
  dbName: string = "hvsna-notes",
): PouchDB.Database => {
  if (!dbInstance) {
    dbInstance = new PouchDB(dbName);
  }
  return dbInstance;
};

/**
 * Create required indexes for optimal query performance
 * @param db - PouchDB database instance
 */
export const createRequiredIndexes = async (
  db: PouchDB.Database,
): Promise<void> => {
  if (indexesCreated) return;

  try {
    // Create index for tasks by hijriDate with hour/minute sorting
    await db.createIndex({
      index: {
        fields: ["_id", "hijriDate", "hour", "minute"],
        name: "tasks-by-hijri-date-index",
        ddoc: "tasks",
      },
    });

    // Create index for tasks by scheduledAtEpochMillis (for date-based queries)
    await db.createIndex({
      index: {
        fields: ["_id", "scheduledAtEpochMillis"],
        name: "tasks-by-scheduled-at-epoch-millis-index",
        ddoc: "tasks",
      },
    });

    // Create index for general task queries
    await db.createIndex({
      index: {
        fields: ["_id", "status", "targetId"],
        name: "tasks-general-index",
        ddoc: "tasks",
      },
    });

    indexesCreated = true;
    console.log("All required database indexes created successfully");
  } catch (error) {
    console.error("Failed to create database indexes:", error);
    throw error;
  }
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetPouchDBInstance = (): void => {
  if (dbInstance) {
    dbInstance.close().catch(() => {
      // Ignore errors during cleanup
    });
    dbInstance = null;
    indexesCreated = false;
  }
};

/**
 * Default database instance export
 */
export const db = getPouchDBInstance();
