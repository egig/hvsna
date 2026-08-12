import { db } from "@/db/client";
import { users } from "@/db/schema";
import { signAccessToken } from "@/lib/jwt";
import { hashPassword, isPasswordValid, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { issueRefreshToken } from "@/lib/tokens";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function getErrorCode(error: unknown): unknown {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error) return (error as { code: unknown }).code;
  return undefined;
}

/**
 * drizzle-orm/neon-http throws a DrizzleQueryError whose .code is undefined;
 * the actual Postgres error code (e.g. "23505") lives on its .cause.
 */
function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (
    getErrorCode(error) === POSTGRES_UNIQUE_VIOLATION ||
    getErrorCode(cause) === POSTGRES_UNIQUE_VIOLATION
  );
}

export async function action({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const { email, password, firstName, lastName } = body;

    if (typeof email !== "string" || !email.includes("@")) {
      throw new ApiError(400, "INVALID_REQUEST", "A valid email is required");
    }
    if (!isPasswordValid(password)) {
      throw new ApiError(
        400,
        "INVALID_REQUEST",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const passwordHash = await hashPassword(password);

    let userId: string;
    try {
      const [inserted] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          firstName: typeof firstName === "string" ? firstName : "",
          lastName: typeof lastName === "string" ? lastName : "",
        })
        .returning({ id: users.id });
      userId = inserted.id;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ApiError(409, "EMAIL_TAKEN", "Email is already registered");
      }
      throw error;
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(userId),
      issueRefreshToken(userId),
    ]);

    return jsonOk({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
