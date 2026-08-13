import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "wa-sqlite";
import { AccessHandlePoolVFS } from "wa-sqlite/src/examples/AccessHandlePoolVFS.js";
import { applyMigrations } from "./migration-runner";
import { runQuery } from "./sql-runner";
import type { SqliteRequest, SqliteWorkerMessage } from "./protocol";

// OPFS sync access handles (what AccessHandlePoolVFS uses) only exist inside
// a dedicated Worker — this file must run there, never on the main thread.
// This VFS also does not implement SQLite's locking protocol itself, so a
// second tab opening the same OPFS files would throw
// NoModificationAllowedError — waitForDbLock() below uses the Web Locks API
// to serialize tabs instead, queueing this one until the other releases it.
declare const self: {
  onmessage: ((event: MessageEvent<SqliteRequest>) => void) | null;
  postMessage: (message: SqliteWorkerMessage) => void;
};

const OPFS_DIRECTORY = "hvsna";
const DB_LOCK_NAME = "hvsna-sqlite-db";

// SQLiteAPI is declared globally (ambient) by wa-sqlite's own type
// definitions — no import needed, see wa-sqlite/src/types/index.d.ts.
let sqlite3: SQLiteAPI;
let db: number;
let vfs: AccessHandlePoolVFS;

async function bootstrap(): Promise<void> {
  const module = await SQLiteESMFactory();
  sqlite3 = SQLite.Factory(module);

  vfs = new AccessHandlePoolVFS(`/${OPFS_DIRECTORY}`);
  await vfs.isReady;
  // AccessHandlePoolVFS isn't part of wa-sqlite's shipped type declarations
  // (see wa-sqlite-shims.d.ts) — it implements the full SQLiteVFS surface
  // via VFS.Base at runtime, just not typed here.
  sqlite3.vfs_register(vfs as unknown as SQLiteVFS, true);

  db = await sqlite3.open_v2("hvsna.sqlite3");

  await applyMigrations(sqlite3, db);
}

/**
 * Wipes all local data: closes the database, releases the VFS's pooled OPFS
 * access handles (they must be released first, or the directory can't be
 * removed while they're open), then deletes the whole OPFS directory. The
 * caller is expected to reload the page afterward for a fresh bootstrap.
 */
async function wipe(): Promise<void> {
  await sqlite3.close(db);
  await vfs.close();
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(OPFS_DIRECTORY, { recursive: true });
}

/**
 * Resolves once this tab holds the exclusive `DB_LOCK_NAME` Web Lock, which
 * is then held for the worker's entire lifetime (the browser releases it
 * automatically when the tab closes or reloads — nothing here ever calls
 * `release`). If another tab already holds it, posts a "locked" status
 * message so the UI can prompt the user, then queues a blocking request and
 * posts "ready" once granted.
 */
function waitForDbLock(): Promise<void> {
  return new Promise<void>((resolveHeld) => {
    void navigator.locks.request(
      DB_LOCK_NAME,
      { ifAvailable: true },
      async (lock) => {
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
      }
    );
  });
}

const ready = (async () => {
  await waitForDbLock();
  await bootstrap();
})();

self.onmessage = async (event) => {
  const message = event.data;
  try {
    await ready;
    if (message.type === "exec") {
      await sqlite3.exec(db, message.sql);
      self.postMessage({ id: message.id, ok: true, rows: [] });
    } else if (message.type === "wipe") {
      await wipe();
      self.postMessage({ id: message.id, ok: true, rows: [] });
    } else {
      const rows = await runQuery(sqlite3, db, message.sql, message.params ?? []);
      self.postMessage({ id: message.id, ok: true, rows });
    }
  } catch (error) {
    self.postMessage({
      id: message.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
