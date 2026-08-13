import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyAccessToken } from "@/lib/jwt";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";

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

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new ApiError(401, "TOKEN_EXPIRED", "User no longer exists");
    }

    return jsonOk({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      featureFlags: {},
    });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
