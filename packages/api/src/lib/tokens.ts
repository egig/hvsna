import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { refreshTokens } from "@/db/schema";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = generateToken();
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return token;
}

export interface RotatedTokens {
  userId: string;
  refreshToken: string;
}

/**
 * Validates + revokes the given refresh token and issues a new one (rotation).
 * Returns null if the token is unknown, already revoked, or expired.
 */
export async function rotateRefreshToken(
  currentToken: string
): Promise<RotatedTokens | null> {
  const tokenHash = hashToken(currentToken);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.revokedAt || row.expiresAt < new Date()) return null;

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, row.id));

  const refreshToken = await issueRefreshToken(row.userId);
  return { userId: row.userId, refreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}
