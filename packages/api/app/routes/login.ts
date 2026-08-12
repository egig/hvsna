import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { handlePreflight, withCors } from "@/lib/cors";
import { signAccessToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { issueRefreshToken } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const body = await readJsonBody(request);
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      throw new ApiError(400, "INVALID_REQUEST", "email and password are required");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      issueRefreshToken(user.id),
    ]);

    return withCors(
      request,
      jsonOk({ access_token: accessToken, refresh_token: refreshToken })
    );
  } catch (error) {
    return withCors(request, jsonUnexpectedError(error));
  }
}
