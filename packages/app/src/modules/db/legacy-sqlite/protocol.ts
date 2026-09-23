export type SqliteValue = string | number | null;

/** OPFS directory holding the legacy database (AccessHandlePoolVFS files). */
export const OPFS_DIRECTORY = "hvsna";

export type LegacyRow = Record<string, SqliteValue>;

/** Every table of the legacy SQLite schema that holds user data, after all
 * of its migrations (see schema.ts) have been applied. */
export const LEGACY_TABLES = [
  "tasks",
  "recurring_tasks",
  "settings",
  "tags",
  "task_tags",
  "recurring_task_tags",
  "_sync_state",
] as const;

export type LegacyTable = (typeof LEGACY_TABLES)[number];

export type LegacyDump = Record<LegacyTable, LegacyRow[]>;

// The worker sends no request/response pairs: it starts exporting as soon
// as it's created and posts exactly one "dump" or "error" message.
export type LegacyWorkerMessage =
  | { kind: "dump"; dump: LegacyDump }
  | { kind: "error"; error: string };
