import { verifyAccessToken } from "./jwt";
import { ApiError } from "./response";

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
