import * as SQLite from "wa-sqlite";
import type { SqliteValue } from "./protocol";

/**
 * Runs one parameterized SQL statement against an open wa-sqlite database
 * and collects its result rows. Shared between the production Worker
 * (worker.ts) and the in-memory test harness (__tests__/test-sqlite-client.ts)
 * so both execute queries identically.
 */
export async function runQuery(
  sqlite3: SQLiteAPI,
  db: number,
  sql: string,
  params: SqliteValue[] = []
): Promise<Record<string, SqliteValue>[]> {
  const rows: Record<string, SqliteValue>[] = [];
  for await (const stmt of sqlite3.statements(db, sql)) {
    if (params.length > 0) {
      sqlite3.bind_collection(stmt, params);
    }
    const columns = sqlite3.column_names(stmt);
    while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
      const values = sqlite3.row(stmt) as SqliteValue[];
      const record: Record<string, SqliteValue> = {};
      columns.forEach((column, i) => {
        record[column] = values[i];
      });
      rows.push(record);
    }
  }
  return rows;
}
