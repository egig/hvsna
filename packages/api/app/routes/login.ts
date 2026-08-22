import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { signAccessToken } from "@/lib/jwt";
import { clearLoginAttempts, isLoginThrottled, recordLoginFailure } from "@/lib/login-throttle";
import { verifyPassword } from "@/lib/password";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { issueRefreshToken } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const { email, password } = body;
    if (typeof email !== "string" || typeof password !== "string") {
      throw new ApiError(400, "INVALID_REQUEST", "email and password are required");
    }
    const normalizedEmail = email.toLowerCase();

    if (await isLoginThrottled(normalizedEmail)) {
      throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many failed attempts. Try again later.");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      await recordLoginFailure(normalizedEmail);
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    await clearLoginAttempts(normalizedEmail);

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(user.id),
      issueRefreshToken(user.id),
    ]);

    return jsonOk({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
