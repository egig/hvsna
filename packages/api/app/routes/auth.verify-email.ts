import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { consumeEmailVerificationToken } from "@/lib/verification-tokens";

export async function action({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const { token } = body;
    if (typeof token !== "string" || token.length === 0) {
      throw new ApiError(400, "INVALID_REQUEST", "A verification token is required");
    }

    const userId = await consumeEmailVerificationToken(token);
    if (!userId) {
      throw new ApiError(400, "INVALID_TOKEN", "This verification link is invalid or has expired");
    }

    await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));

    return jsonOk({});
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
