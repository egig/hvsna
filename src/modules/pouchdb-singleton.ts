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
  dbName: string = "hvsna-notes"
): PouchDB.Database => {
  if (!dbInstance) {
    dbInstance = new PouchDB(dbName);
  }
  return dbInstance;
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
