import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { refreshTokens, type RefreshTokenRow } from "@/db/schema";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * How long after a token is rotated away its redemption is still treated as
 * a lost-response retry instead of reuse. Comfortably longer than the
 * client's HTTP timeouts (mobile clients use OkHttp's ~10s defaults) plus a
 * retry, short enough to keep the reuse-detection blind spot small.
 */
const REUSE_GRACE_WINDOW_MS = 30 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Starts a brand-new token family (one per login/register call, i.e. per device session). */
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

/** Thrown when a token is redeemed outside the reuse grace window — the whole family has been revoked. */
export class TokenReuseDetectedError extends Error {
  constructor() {
    super("Refresh token reuse detected");
  }
}

/**
 * Validates + rotates the given refresh token.
 * - Unknown token, or an unrevoked token past its expiry: returns null (benign "expired").
 * - A live, unexpired token: revokes it, issues a new token in the same family, returns it.
 * - An already-revoked token whose successor is still the family's live tip, redeemed within
 *   the reuse grace window: a retry of a rotation whose response the client never received —
 *   rotates the successor forward on the caller's behalf instead of rejecting.
 * - Any other redemption of an already-revoked token: reuse — revokes the entire family and throws.
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

  if (!row) return null;
  if (row.revokedAt) return handleRevokedRedemption(row);
  if (row.expiresAt < new Date()) return null;

  return rotateRow(row);
}

async function rotateRow(row: RefreshTokenRow): Promise<RotatedTokens> {
  const refreshToken = generateToken();
  const nextId = randomUUID();

  await Promise.all([
    db.insert(refreshTokens).values({
      id: nextId,
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    }),
    db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), replacedByTokenId: nextId })
      .where(eq(refreshTokens.id, row.id)),
  ]);

  return { userId: row.userId, refreshToken };
}

async function handleRevokedRedemption(
  row: RefreshTokenRow
): Promise<RotatedTokens | null> {
  const successor = row.replacedByTokenId
    ? (
        await db
          .select()
          .from(refreshTokens)
          .where(eq(refreshTokens.id, row.replacedByTokenId))
          .limit(1)
      )[0]
    : undefined;

  const withinGraceWindow =
    row.revokedAt != null &&
    Date.now() - row.revokedAt.getTime() <= REUSE_GRACE_WINDOW_MS;
  const successorIsLiveTip = successor != null && successor.revokedAt === null;

  if (successor && successorIsLiveTip && withinGraceWindow) {
    return rotateRow(successor);
  }

  await revokeFamily(row.familyId);
  throw new TokenReuseDetectedError();
}

async function revokeFamily(familyId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt))
    );
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}
