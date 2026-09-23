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
// Worker. That VFS doesn't implement SQLite's locking protocol, so older
// builds serialized tabs with the `DB_LOCK_NAME` Web Lock — taken here too,
// so a still-open old-version tab finishes with the database before it's
// read. The lock is held until the importer terminates this worker, after
// it has removed the OPFS directory.
declare const self: {
  postMessage: (message: LegacyWorkerMessage) => void;
};

const DB_LOCK_NAME = "hvsna-sqlite-db";

function waitForDbLock(): Promise<void> {
  return new Promise<void>((resolveHeld) => {
    void navigator.locks.request(DB_LOCK_NAME, { ifAvailable: true }, async (lock) => {
      if (lock) {
        resolveHeld();
        await new Promise<void>(() => {});
        return;
      }
      self.postMessage({ kind: "status", state: "locked" });
      await navigator.locks.request(DB_LOCK_NAME, async () => {
        self.postMessage({ kind: "status", state: "ready" });
        resolveHeld();
        await new Promise<void>(() => {});
      });
    });
  });
}

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
    await waitForDbLock();
    self.postMessage({ kind: "dump", dump: await exportDatabase() });
  } catch (error) {
    self.postMessage({
      kind: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
})();
