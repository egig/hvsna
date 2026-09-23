import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "wa-sqlite";
import { AccessHandlePoolVFS } from "wa-sqlite/src/examples/AccessHandlePoolVFS.js";
import { applyMigrations } from "./migration-runner";
import { runQuery } from "./sql-runner";
import {
  LEGACY_TABLES,
  OPFS_DIRECTORY,
  type LegacyDump,
  type LegacyWorkerMessage,
} from "./protocol";

// Reads the SQLite database older builds of the app kept in OPFS so
// ../legacy-sqlite-import.ts can copy it into IndexedDB. OPFS sync access
// handles (what AccessHandlePoolVFS uses) only exist inside a dedicated
// Worker. The importer only starts this worker once its tab holds the tab
// lock (../tab-lock.ts, the same lock older builds used), so no other tab
// has the database open while it's read.
declare const self: {
  postMessage: (message: LegacyWorkerMessage) => void;
};

async function exportDatabase(): Promise<LegacyDump> {
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);
  const vfs = new AccessHandlePoolVFS(`/${OPFS_DIRECTORY}`);
  await vfs.isReady;
  // AccessHandlePoolVFS isn't part of wa-sqlite's shipped type declarations
  // (see wa-sqlite-shims.d.ts) — it implements the full SQLiteVFS surface
  // via VFS.Base at runtime, just not typed here.
  sqlite3.vfs_register(vfs as unknown as SQLiteVFS, true);
  const db = await sqlite3.open_v2("hvsna.sqlite3");
  try {
    // Brings a database last opened by an older build up to the final
    // legacy schema, so every install exports the same table shapes.
    await applyMigrations(sqlite3, db);
    const dump = {} as LegacyDump;
    for (const table of LEGACY_TABLES) {
      dump[table] = await runQuery(sqlite3, db, `SELECT * FROM ${table}`);
    }
    return dump;
  } finally {
    await sqlite3.close(db);
    // Releases the pooled access handles so the directory can be removed.
    await vfs.close();
  }
}

(async () => {
  try {
    self.postMessage({ kind: "dump", dump: await exportDatabase() });
  } catch (error) {
    self.postMessage({
      kind: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
})();
