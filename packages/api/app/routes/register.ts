import { db } from "@/db/client";
import { users } from "@/db/schema";
import { handlePreflight, withCors } from "@/lib/cors";
import { signAccessToken } from "@/lib/jwt";
import { hashPassword, isPasswordValid, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { issueRefreshToken } from "@/lib/tokens";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

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

    return withCors(
      request,
      jsonOk({ access_token: accessToken, refresh_token: refreshToken })
    );
  } catch (error) {
    return withCors(request, jsonUnexpectedError(error));
  }
}
