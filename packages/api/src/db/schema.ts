import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  bigint,
  bigserial,
  boolean,
  primaryKey,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * `familyId` groups every token descended from one login/register call (one
 * per device session) — rotation carries it forward, so the whole chain
 * shares it. `replacedByTokenId` points a revoked row at whatever token it
 * was rotated into, letting a redeemed-but-already-revoked token be told
 * apart as either a lost-response retry (successor is still live, redeemed
 * within the reuse grace window — see rotateRefreshToken) or actual reuse
 * (anything else), which revokes the whole family. Deliberately not a real
 * FK — self-referencing FKs need the two-migration add-column-then-add-
 * constraint dance in Postgres, and this is an internal bookkeeping pointer
 * rather than data integrity that needs DB-level enforcement.
 */
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").notNull().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  replacedByTokenId: uuid("replaced_by_token_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Per-email failed-login counter for /login throttling — keyed by email
 * rather than IP (simplest thing that stops both credential stuffing and
 * plain brute force against one account; see login-throttle.ts). One row
 * per email; `firstFailedAt` anchors the current window and gets reset
 * whenever a failure arrives after the window has elapsed.
 */
export const loginAttempts = pgTable("login_attempts", {
  email: text("email").primaryKey(),
  failCount: integer("fail_count").notNull().default(0),
  firstFailedAt: timestamp("first_failed_at", { withTimezone: true }).notNull(),
});

export type LoginAttemptRow = typeof loginAttempts.$inferSelect;

/**
 * One-time tokens emailed to a user to prove control of their address.
 * Mirrors refresh_tokens' hash-in-DB / raw-token-in-transit pattern —
 * only a sha256 hash is ever stored, the raw token lives solely in the
 * emailed link. Consuming a token deletes its row (single use).
 */
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type EmailVerificationTokenRow = typeof emailVerificationTokens.$inferSelect;

/**
 * One row per user (unique `user_id`) tracking their single Lemon Squeezy
 * subscription — a second checkout for an already-subscribed user re-uses
 * the same row rather than creating a new one, since the product only has
 * one paid plan. Fully server-authored (via webhooks, see
 * app/routes/webhooks.lemonsqueezy.ts), so plain `timestamp` columns are
 * used rather than the client-authored epoch-millis convention the sync
 * tables use.
 */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  lemonSqueezySubscriptionId: text("lemon_squeezy_subscription_id")
    .notNull()
    .unique(),
  lemonSqueezyCustomerId: text("lemon_squeezy_customer_id").notNull(),
  lemonSqueezyOrderId: text("lemon_squeezy_order_id"),
  variantId: text("variant_id").notNull(),
  status: text("status").notNull(),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  cardBrand: text("card_brand"),
  cardLastFour: text("card_last_four"),
  updatePaymentMethodUrl: text("update_payment_method_url"),
  customerPortalUrl: text("customer_portal_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SubscriptionRow = typeof subscriptions.$inferSelect;

/**
 * Every synced entity — tasks, recurring tasks, tags, settings, and any type
 * a client introduces later — lives in this one table. The server reads only
 * the envelope columns; everything else is an opaque `payload` the clients
 * own, so adding a field or a whole entity type needs no migration and no
 * API change (see src/lib/sync-push.ts / sync-pull.ts).
 *
 * - `entity_type` is the wire table key (`tasks`, `settings`, …) and part of
 *   the primary key, so ids are namespaced per type and a row's type can
 *   never change.
 * - `id` is the row's client-assigned id (for `settings`, its `key`).
 * - `payload` holds every non-envelope wire field (including `tag_ids` and
 *   `created_at`). An accepted push merges into it with jsonb `||`, so a key
 *   the pushing client doesn't know survives; `null` clears a key.
 * - `updated_at`/`deleted_at` are client-authored epoch-millis `bigint`
 *   (not `timestamp`), compared as raw numbers for row-level last-write-wins —
 *   round-tripping through `Date` would be lossy on exactly the field that
 *   decision depends on.
 * - `rev` is drawn from one shared sequence on every insert and re-drawn on
 *   every accepted update, never client-set. /sync/pull pages each type by
 *   it; /sync/push takes a per-user advisory lock so a user's revs commit in
 *   order and a pull can't skip past an uncommitted one.
 *
 * No foreign keys between entities: references (`recurring_task_id`,
 * `tag_ids`) live inside `payload` and are the clients' to resolve.
 */
export const syncEntities = pgTable(
  "sync_entities",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    id: text("id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
    deletedAt: bigint("deleted_at", { mode: "number" }),
    rev: bigserial("rev", { mode: "number" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.entityType, t.id] }),
    index("sync_entities_user_type_rev_idx").on(t.userId, t.entityType, t.rev),
  ]
);

export type SyncEntityRow = typeof syncEntities.$inferSelect;
