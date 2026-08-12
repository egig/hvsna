import type { Page } from "@playwright/test";

/**
 * Wipe all local SQLite/OPFS data via the same dev-only hook the in-app
 * "wipe data" settings feature uses (window.__hvsnaResetLocalData, set in
 * src/platforms/web/main.tsx). Reusing that path — rather than deleting OPFS
 * files directly here — avoids racing the dedicated SQLite Worker's open
 * OPFS access handles, which must be released before the directory can be
 * removed (see src/modules/sqlite/worker.ts's wipe()).
 */
export async function resetLocalData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // @ts-expect-error dev-only test hook, see main.tsx
    await window.__hvsnaResetLocalData?.();
  });
}
