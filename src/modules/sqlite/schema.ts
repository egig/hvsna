import userMigration0000 from "./migrations/user/0000_rainy_brother_voodoo.sql?raw";

/**
 * Copied verbatim from ../hvsna-sync2/migrations/user/*.sql (see that repo's
 * src/db/user-migrations.ts for the server-side equivalent list), applied in
 * order to bootstrap a new local database. Re-copy into migrations/user/ and
 * add to both lists whenever the schema evolves.
 */
export const userMigrations: string[] = [userMigration0000];

/**
 * Client-only additions on top of the shared schema: `_dirty` flags which
 * local rows have unpushed changes (see Sqlite*Repository classes), and a
 * key/value table for local-only sync bookkeeping (last-pulled seq, etc.)
 * that — like PouchDB's `_local/*` docs before it — never syncs itself.
 */
export const CLIENT_ONLY_MIGRATION = `
  ALTER TABLE tasks ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE recurring_tasks ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE settings ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  CREATE TABLE _sync_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;
