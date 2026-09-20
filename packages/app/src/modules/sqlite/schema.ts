import userMigration0000 from "./migrations/user/0000_rainy_brother_voodoo.sql?raw";
import userMigration0001 from "./migrations/user/0001_normalize_tags_and_settings.sql?raw";
import userMigration0002 from "./migrations/user/0002_drop_changes_table.sql?raw";
import userMigration0003 from "./migrations/user/0003_add_duration_minutes.sql?raw";

export interface UserMigration {
  id: string;
  sql: string;
}

/**
 * Local-first schema, owned directly by this app (no longer mirrored from
 * an external backend), applied in order to bootstrap a new local database.
 * A future sync rebuild against packages/api will need to reconcile this
 * with whatever server-side schema it introduces for synced data.
 *
 * Applied incrementally and tracked by id in `_migrations` — see
 * migration-runner.ts. The first entry is special-cased there as the base
 * schema (only run against a database with no `tasks` table yet); every
 * entry after it is a genuine forward migration applied to all databases,
 * new or existing, exactly once.
 */
export const userMigrations: UserMigration[] = [
  { id: "0000_rainy_brother_voodoo", sql: userMigration0000 },
  { id: "0001_normalize_tags_and_settings", sql: userMigration0001 },
  { id: "0002_drop_changes_table", sql: userMigration0002 },
  { id: "0003_add_duration_minutes", sql: userMigration0003 },
];

export const CLIENT_ONLY_MIGRATION_ID = "0000_client_only";

/**
 * Client-only additions on top of the shared schema: `_dirty` flags which
 * local rows have unpushed changes (see Sqlite*Repository classes), and a
 * key/value table for local-only sync bookkeeping (last-pulled seq, etc.)
 * that — like PouchDB's `_local/*` docs before it — never syncs itself.
 * Only ever run once, immediately after the base schema (see
 * migration-runner.ts) — tables introduced by later migrations bring their
 * own `_dirty` column directly instead of extending this constant.
 */
export const CLIENT_ONLY_MIGRATION = `
  ALTER TABLE tasks ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE recurring_tasks ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE settings ADD COLUMN _dirty INTEGER NOT NULL DEFAULT 1;
  CREATE TABLE _sync_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;
