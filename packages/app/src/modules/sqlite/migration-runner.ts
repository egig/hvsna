import {
  userMigrations,
  CLIENT_ONLY_MIGRATION,
  CLIENT_ONLY_MIGRATION_ID,
} from "./schema";
import { runQuery } from "./sql-runner";

async function markApplied(sqlite3: SQLiteAPI, db: number, id: string): Promise<void> {
  await runQuery(sqlite3, db, `INSERT OR IGNORE INTO _migrations (id, applied_at) VALUES (?, ?)`, [
    id,
    Date.now(),
  ]);
}

async function isApplied(sqlite3: SQLiteAPI, db: number, id: string): Promise<boolean> {
  const rows = await runQuery(sqlite3, db, `SELECT 1 FROM _migrations WHERE id = ?`, [id]);
  return rows.length > 0;
}

/**
 * Applies pending migrations in order, tracked by id in `_migrations` so
 * each one runs exactly once per database. On a brand-new database this
 * runs everything from scratch (base schema, then the client-only `_dirty`
 * additions, then every named migration). On a database that already has
 * a `tasks` table but predates this tracking table, the base schema and
 * client-only migration are known to already be applied (they used to be
 * the entire, untracked bootstrap) so they're just backfilled into
 * `_migrations` without re-running their SQL — only genuinely new
 * migrations after that point get executed. Safe to call on every startup.
 */
export async function applyMigrations(sqlite3: SQLiteAPI, db: number): Promise<void> {
  await sqlite3.exec(
    db,
    `CREATE TABLE IF NOT EXISTS _migrations (id text PRIMARY KEY NOT NULL, applied_at integer NOT NULL)`
  );

  const [{ tableCount }] = await runQuery(
    sqlite3,
    db,
    `SELECT count(*) AS tableCount FROM sqlite_master WHERE type = 'table' AND name = 'tasks'`
  );

  const [base, ...rest] = userMigrations;

  if (Number(tableCount) === 0) {
    await sqlite3.exec(db, base.sql);
    await sqlite3.exec(db, CLIENT_ONLY_MIGRATION);
  }
  await markApplied(sqlite3, db, base.id);
  await markApplied(sqlite3, db, CLIENT_ONLY_MIGRATION_ID);

  for (const migration of rest) {
    if (await isApplied(sqlite3, db, migration.id)) continue;
    await sqlite3.exec(db, migration.sql);
    await markApplied(sqlite3, db, migration.id);
  }
}
