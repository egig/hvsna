import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";
import { requireAuth } from "@/lib/require-auth";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { buildVerificationUrl, issueEmailVerificationToken } from "@/lib/verification-tokens";

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireAuth(request);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new ApiError(401, "TOKEN_EXPIRED", "User no longer exists");
    }
    if (user.emailVerified) {
      return jsonOk({}, "Email is already verified");
    }

    const verificationToken = await issueEmailVerificationToken(userId);
    await sendVerificationEmail(user.email, buildVerificationUrl(verificationToken));

    return jsonOk({});
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
