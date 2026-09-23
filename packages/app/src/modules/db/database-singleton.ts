import { HvsnaDatabase } from "./database";
import { createDbExecutor, type DbExecutor } from "./executor";
import { removeLegacySqliteData } from "./legacy-sqlite-import";

let instance: { db: HvsnaDatabase; executor: DbExecutor } | null = null;

/** The app-wide database executor, created on first use. */
export const getDatabase = (): DbExecutor => {
  if (!instance) {
    const db = new HvsnaDatabase();
    instance = { db, executor: createDbExecutor(db) };
  }
  return instance.executor;
};

/**
 * Deletes all local data, including any pre-IndexedDB SQLite/OPFS database
 * left behind. Reload the page afterward to start fresh.
 */
export async function wipeLocalData(): Promise<void> {
  const db = instance?.db ?? new HvsnaDatabase();
  instance = null;
  await db.delete();
  await removeLegacySqliteData();
}
