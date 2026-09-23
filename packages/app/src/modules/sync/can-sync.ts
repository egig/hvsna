import type { User } from "@/modules/auth/user";

/**
 * Mirrors packages/api's requireSyncAuth: /sync/push and /sync/pull reject
 * with 403 EMAIL_NOT_VERIFIED or 403 SYNC_PLAN_REQUIRED unless the user has
 * both a verified email and a Sync plan, so no trigger should fire a request
 * that's guaranteed to fail.
 */
export function userCanSync(user: User | null | undefined): boolean {
  return !!user?.emailVerified && !!user?.syncEnabled;
}

/** A verified user without a Sync plan — the case the sync screen upsells. */
export function userNeedsSyncPlan(user: User | null | undefined): boolean {
  return !!user?.emailVerified && !user?.syncEnabled;
}

/** The 403 requireSyncAuth sends once a plan lapses (or before one exists). */
export function isSyncPlanRequiredError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "SYNC_PLAN_REQUIRED"
  );
}
