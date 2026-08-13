import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  bigint,
  bigserial,
  doublePrecision,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;

/**
 * Sync tables mirror packages/app's client-owned wa-sqlite schema
 * (src/modules/sqlite/migrations/user/0000_rainy_brother_voodoo.sql) column
 * for column, scoped per user. Timestamps stay epoch-millis `bigint`
 * (not `timestamp`) because they're client-authored and compared as raw
 * numbers for last-write-wins conflict resolution — round-tripping through
 * `Date` would be lossy on exactly the field that decision depends on.
 * `rev` is a per-table monotonic cursor (drawn from its bigserial sequence
 * on every insert and re-drawn on every accepted update, never client-set)
 * used only for /sync/pull pagination — unrelated to the client's own
 * unused `Task.rev` field left over from the old PouchDB implementation.
 */
export const recurringTasks = pgTable(
  "recurring_tasks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    recurringType: text("recurring_type").notNull(),
    recurringInterval: integer("recurring_interval").notNull(),
    baseDateEpoch: bigint("base_date_epoch", { mode: "number" }).notNull(),
    atTime: text("at_time"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    timezone: text("timezone"),
    hijriDateOffset: integer("hijri_date_offset"),
    recurringEnd: text("recurring_end"),
    recurringEndEpoch: bigint("recurring_end_epoch", { mode: "number" }),
    recurringEndOccurrences: integer("recurring_end_occurrences"),
    useGregorian: integer("use_gregorian").notNull(),
    occurrenceExceptions: text("occurrence_exceptions"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("recurring_tasks_user_rev_idx").on(t.userId, t.rev),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: integer("status").notNull(),
    atTime: text("at_time"),
    atEpochMillis: bigint("at_epoch_millis", { mode: "number" }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    timezone: text("timezone"),
    recurringType: text("recurring_type"),
    recurringInterval: integer("recurring_interval"),
    recurringTaskId: text("recurring_task_id"),
    hijriDateOffset: integer("hijri_date_offset"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    completedAt: bigint("completed_at", { mode: "number" }),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    foreignKey({
      columns: [t.userId, t.recurringTaskId],
      foreignColumns: [recurringTasks.userId, recurringTasks.id],
      name: "tasks_recurring_task_fk",
    }),
    index("tasks_user_rev_idx").on(t.userId, t.rev),
  ]
);

/**
 * One row per top-level settings key, mirroring the client's move away from
 * a single JSON-blob row (see packages/app/src/infra/settings/
 * SqliteSettingsRepository.ts) — lets two devices change different settings
 * keys concurrently without one clobbering the other's write.
 */
export const settings = pgTable(
  "settings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.key] }),
    index("settings_user_rev_idx").on(t.userId, t.rev),
  ]
);

/**
 * Normalized tags, mirroring the client's move away from a JSON tags array
 * column on tasks/recurring_tasks (see packages/app/src/modules/sqlite/
 * migrations/user/0001_normalize_tags_and_settings.sql). `task_tags` /
 * `recurring_task_tags` are membership-only join tables — they carry no
 * `updated_at`/`rev`/`_dirty` of their own (same as client-side), because
 * membership changes ride along with the owning task/recurring_task's own
 * push: /sync/push fully replaces a row's associations whenever its LWW
 * check accepts the new version (see src/lib/sync-tag-links.ts).
 */
export const tags = pgTable(
  "tags",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("tags_user_rev_idx").on(t.userId, t.rev),
  ]
);

export const taskTags = pgTable(
  "task_tags",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.taskId, t.tagId] }),
    foreignKey({
      columns: [t.userId, t.taskId],
      foreignColumns: [tasks.userId, tasks.id],
      name: "task_tags_task_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.userId, t.tagId],
      foreignColumns: [tags.userId, tags.id],
      name: "task_tags_tag_fk",
    }).onDelete("cascade"),
    index("task_tags_tag_idx").on(t.userId, t.tagId),
  ]
);

export const recurringTaskTags = pgTable(
  "recurring_task_tags",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recurringTaskId: text("recurring_task_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recurringTaskId, t.tagId] }),
    foreignKey({
      columns: [t.userId, t.recurringTaskId],
      foreignColumns: [recurringTasks.userId, recurringTasks.id],
      name: "recurring_task_tags_recurring_task_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.userId, t.tagId],
      foreignColumns: [tags.userId, tags.id],
      name: "recurring_task_tags_tag_fk",
    }).onDelete("cascade"),
    index("recurring_task_tags_tag_idx").on(t.userId, t.tagId),
  ]
);

export type RecurringTaskRow = typeof recurringTasks.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
