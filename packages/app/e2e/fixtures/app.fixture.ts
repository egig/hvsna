import { test as base, type Page } from "@playwright/test";
import { resetLocalData } from "../helpers/db-reset";

type AppFixtures = {
  /** Clean app state for settings routes. */
  appPage: Page;
  /** Clean app state for task routes. */
  taskPage: Page;
};

export const test = base.extend<AppFixtures>({
  /**
   * For settings pages (/settings/general, etc.).
   * Settings are rendered directly from the current route tree.
   */
  appPage: async ({ page }, use) => {
    await use(page);
    // Cleanup: wipe local data after each test
    await resetLocalData(page);
  },

  /**
   * For task pages (/, /inbox, /upcoming, /browse, etc.).
   */
  taskPage: async ({ page }, use) => {
    // Navigate first so the app's IndexedDB storage is accessible, then wipe any leftover state
    await page.goto("/");
    await resetLocalData(page);
    await page.evaluate(() => localStorage.clear());
    // Reload into a guaranteed-clean state.
    await page.reload({ waitUntil: "networkidle" });

    await use(page);
    // Post-test cleanup for the next test
    await resetLocalData(page);
    await page.evaluate(() => localStorage.clear());
  },
});

export { expect } from "@playwright/test";
