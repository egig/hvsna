import type { SqliteClient } from "@/modules/sqlite/client";
import { getAuthService } from "@/infra/auth/AuthServiceFactory";
import { getSyncApiClient } from "@/infra/sync/SyncApiClientFactory";
import { createSyncEngine } from "@/modules/sync/sync-engine";
import { getLastSuccessAt } from "@/modules/sync/cursor-store";
import { userCanSync } from "@/modules/sync/can-sync";
import type { User } from "@/modules/auth/user";
import log from "@/modules/logger";

export interface BootstrapResult {
  /** The signed-in user, or null if there's no (valid) session. */
  user: User | null;
  /** Timestamp of the most recent successful sync, read back from local state. */
  lastSyncAt: Date | null;
  /** True only if a full push/pull actually completed during bootstrap. */
  initialSyncPerformed: boolean;
}

/** Hard cap on the pre-render initial sync so a slow/hung network can't keep
 * the "Initiating…" screen up indefinitely — the app renders anyway and the
 * SyncProvider retries in the background. */
const SYNC_BUDGET_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Runs once, before the first React render, so the app paints real state
 * instead of a blip of empty local data that a moment-later sync then
 * overwrites:
 *
 *   1. Restore the session — refresh the access token from the stored
 *      refresh token — and load the current user.
 *   2. If signed in with a verified email, run one full push/pull so the
 *      local SQLite DB is already reconciled before any screen mounts.
 *
 * Every step is best-effort: a failure here just means the app starts in
 * whatever state it already had (offline, expired session, sync down),
 * exactly as it behaved before this gate existed. The results are handed to
 * <App> so AuthProvider/SyncProvider can seed their initial state and skip
 * the work this function already did.
 */
export async function bootstrapApp(
  sqliteClient: SqliteClient
): Promise<BootstrapResult> {
  const result: BootstrapResult = {
    user: null,
    lastSyncAt: null,
    initialSyncPerformed: false,
  };

  const authService = getAuthService();
  try {
    await authService.initialize();
    if (await authService.isAuthenticated()) {
      result.user = await authService.getCurrentUser();
    }
  } catch (error) {
    log.warn("bootstrap: session restore failed", error);
  }

  // Matches SyncProvider's canSync gate — the API rejects /sync/* without a
  // verified email and a Sync plan, so there's nothing to pull otherwise.
  if (userCanSync(result.user)) {
    try {
      const engine = createSyncEngine(sqliteClient, getSyncApiClient());
      await withTimeout(engine.fullSync(), SYNC_BUDGET_MS, "initial sync");
      result.initialSyncPerformed = true;
    } catch (error) {
      log.warn("bootstrap: initial sync failed", error);
    }
  }

  try {
    result.lastSyncAt = await getLastSuccessAt(sqliteClient);
  } catch {
    // best-effort — SyncProvider re-reads this itself on mount too
  }

  return result;
}
