import { createTransactionalExecutor } from "../transaction-executor";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite.mjs";
import * as SQLite from "wa-sqlite";
import { MemoryVFS } from "wa-sqlite/src/examples/MemoryVFS.js";
import { applyMigrations } from "../migration-runner";
import { runQuery } from "../sql-runner";
import type { SqliteExecutor, SqliteValue } from "../client";

// wa-sqlite's Emscripten-generated loader fetches its .wasm binary via a
// `file://` URL when run outside a bundler — Node's native fetch (undici)
// doesn't support the file: protocol at all ("not implemented... yet...").
// Every test file using this harness also needs `// @vitest-environment node`
// at the top (Vitest requires that annotation per-file; it can't be applied
// from here) since jsdom's `window` would otherwise make Emscripten prefer a
// different, equally unsupported loading path.
let fetchPatched = false;
function patchFileFetchForWasm(): void {
  if (fetchPatched) return;
  fetchPatched = true;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith("file://")) {
      const bytes = readFileSync(fileURLToPath(url));
      const contentType = url.endsWith(".wasm")
        ? "application/wasm"
        : "application/octet-stream";
      return new Response(bytes, {
        status: 200,
        headers: { "Content-Type": contentType },
      });
    }
    return realFetch(input, init);
  }) as typeof fetch;
}

/**
 * An in-memory, real-SQLite `SqliteExecutor` for tests — same schema and
 * query-execution path as the production Worker (worker.ts), just backed by
 * wa-sqlite's plain-JS MemoryVFS instead of AccessHandlePoolVFS/OPFS (which
 * needs a real browser). This exercises the repositories' hand-written SQL
 * for real, rather than mocking it away.
 */
export async function createTestSqliteClient(): Promise<SqliteExecutor> {
  patchFileFetchForWasm();
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);

  const vfs = new MemoryVFS();
  sqlite3.vfs_register(vfs as unknown as SQLiteVFS, true);

  const db = await sqlite3.open_v2("test.sqlite3");

  await applyMigrations(sqlite3, db);

  return createTransactionalExecutor({
    async exec(sql: string): Promise<void> {
      await sqlite3.exec(db, sql);
    },
    async run(
      sql: string,
      params: SqliteValue[] = []
    ): Promise<Record<string, SqliteValue>[]> {
      return runQuery(sqlite3, db, sql, params);
    },
  });
}
