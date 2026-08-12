import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { handlePreflight, withCors } from "@/lib/cors";
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

    return withCors(
      request,
      jsonOk({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        featureFlags: {},
      })
    );
  } catch (error) {
    return withCors(request, jsonUnexpectedError(error));
  }
}

/** GET-only route; action exists solely to answer CORS preflight OPTIONS requests. */
export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;
  return withCors(
    request,
    jsonUnexpectedError(new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed"))
  );
}
