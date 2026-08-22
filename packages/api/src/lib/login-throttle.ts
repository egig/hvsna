import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { loginAttempts } from "@/db/schema";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function windowExpired(firstFailedAt: Date): boolean {
  return Date.now() - firstFailedAt.getTime() > WINDOW_MS;
}

/** True if this email has hit the failed-attempt ceiling within the current window. */
export async function isLoginThrottled(email: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .limit(1);
  if (!row || windowExpired(row.firstFailedAt)) return false;
  return row.failCount >= MAX_ATTEMPTS;
}

/** Records a failed login attempt, starting a new window if the previous one expired. */
export async function recordLoginFailure(email: string): Promise<void> {
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .limit(1);

  if (!row || windowExpired(row.firstFailedAt)) {
    await db
      .insert(loginAttempts)
      .values({ email, failCount: 1, firstFailedAt: new Date() })
      .onConflictDoUpdate({
        target: loginAttempts.email,
        set: { failCount: 1, firstFailedAt: new Date() },
      });
    return;
  }

  await db
    .update(loginAttempts)
    .set({ failCount: row.failCount + 1 })
    .where(eq(loginAttempts.email, email));
}

/** Clears any throttle state on successful login. */
export async function clearLoginAttempts(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}
