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
    tags: text("tags"),
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
    tags: text("tags"),
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

export const settings = pgTable(
  "settings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull().default("settings"),
    payload: text("payload").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.id] }),
    index("settings_user_rev_idx").on(t.userId, t.rev),
  ]
);

export type RecurringTaskRow = typeof recurringTasks.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
