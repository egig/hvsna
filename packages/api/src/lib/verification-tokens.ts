import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { emailVerificationTokens } from "@/db/schema";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Issues a new verification token, discarding any previous ones for this
 * user so an old emailed link stops working once a new one is sent.
 */
export async function issueEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, userId));
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });
  return token;
}

/** Builds the link emailed to the user; APP_URL points at the client app. */
export function buildVerificationUrl(token: string): string {
  const appUrl = process.env.APP_URL ?? "http://localhost:5173";
  return `${appUrl.replace(/\/$/, "")}/verify-email?token=${token}`;
}

/**
 * Validates and consumes (single use) the given verification token.
 * Returns the associated userId, or null if unknown/expired.
 */
export async function consumeEmailVerificationToken(
  rawToken: string
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt < new Date()) return null;

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.id, row.id));
  return row.userId;
}
