import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { verifyAccessToken } from "@/lib/jwt";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { hasSyncEntitlement } from "@/lib/sync-entitlement";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export async function loader({ request }: { request: Request }) {
  try {
    const token = getBearerToken(request);
    const userId = token ? await verifyAccessToken(token) : null;
    if (!userId) {
      throw new ApiError(401, "TOKEN_EXPIRED", "Access token is missing or invalid");
    }

    // Joined so `syncEnabled` (the same rule /sync/* enforces via
    // requireSyncAuth) rides along with the user at no extra round trip.
    const [row] = await db
      .select({
        user: users,
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
    const { user } = row;
    const syncEnabled = hasSyncEntitlement(
      row.subscriptionStatus === null
        ? null
        : { status: row.subscriptionStatus, endsAt: row.subscriptionEndsAt }
    );

    return jsonOk({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      syncEnabled,
      createdAt: user.createdAt.toISOString(),
      featureFlags: {},
    });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
