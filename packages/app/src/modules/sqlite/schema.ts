import userMigration0000 from "./migrations/user/0000_rainy_brother_voodoo.sql?raw";

/**
 * Local-first schema, owned directly by this app (no longer mirrored from
 * an external backend), applied in order to bootstrap a new local database.
 * A future sync rebuild against packages/api will need to reconcile this
 * with whatever server-side schema it introduces for synced data.
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
