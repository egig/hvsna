import type { Page } from "@playwright/test";

/**
 * Wipe all local IndexedDB data via the same dev-only hook the in-app
 * "wipe data" settings feature uses (window.__hvsnaResetLocalData, set in
 * src/main.tsx), so tests exercise the real wipe path (see
 * src/modules/db/database-singleton.ts's wipeLocalData()).
 */
export async function resetLocalData(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // @ts-expect-error dev-only test hook, see main.tsx
    await window.__hvsnaResetLocalData?.();
  });
}
