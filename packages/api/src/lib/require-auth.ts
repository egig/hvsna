import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { verifyAccessToken } from "./jwt";
import { ApiError } from "./response";
import { hasSyncEntitlement } from "./sync-entitlement";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

/**
 * Verifies the request's Bearer access token and returns the userId encoded
 * in it. Trusts the JWT subject directly rather than re-checking the user
 * still exists in `users` (unlike /me) — every write this guards is FK-
 * constrained to `users.id`, so a deleted user surfaces as a loud 500 rather
 * than silent data loss, and skipping the extra lookup avoids a second
 * neon-http round trip on every sync call.
 */
export async function requireAuth(request: Request): Promise<string> {
  const token = getBearerToken(request);
  const userId = token ? await verifyAccessToken(token) : null;
  if (!userId) {
    throw new ApiError(401, "TOKEN_EXPIRED", "Access token is missing or invalid");
  }
  return userId;
}

/**
 * Like requireAuth, but additionally requires what sync needs: a verified
 * email and a Sync plan entitlement (see hasSyncEntitlement). Both come from
 * one users ⟕ subscriptions lookup, so gating on the plan costs no extra
 * neon-http round trip over the emailVerified check alone.
 */
export async function requireSyncAuth(request: Request): Promise<string> {
  const userId = await requireAuth(request);

  const [row] = await db
    .select({
      emailVerified: users.emailVerified,
      subscriptionStatus: subscriptions.status,
      subscriptionEndsAt: subscriptions.endsAt,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw new ApiError(401, "TOKEN_EXPIRED", "User no longer exists");
  }
  if (!row.emailVerified) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify your email before syncing");
  }
  const subscription =
    row.subscriptionStatus === null
      ? null
      : { status: row.subscriptionStatus, endsAt: row.subscriptionEndsAt };
  if (!hasSyncEntitlement(subscription)) {
    throw new ApiError(403, "SYNC_PLAN_REQUIRED", "An active Sync plan is required to sync");
  }

  return userId;
}
