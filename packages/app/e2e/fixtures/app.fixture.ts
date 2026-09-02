import { test as base, type Page } from "@playwright/test";
import { resetLocalData } from "../helpers/db-reset";

type AppFixtures = {
  /** No onboarding bypass — use for settings routes. */
  appPage: Page;
  /** Onboarding completed. Use for task routes. */
  taskPage: Page;
};

/**
 * Complete the 3-step onboarding flow.
 * Geolocation is mocked via playwright.config.ts (21.3891, 39.8579).
 */
async function completeOnboarding(page: Page): Promise<void> {
  // Step 1: Language — click English
  await page.getByRole("button", { name: "English" }).click();

  // Step 2: Location — use current location (mocked geolocation)
  await page.getByRole("button", { name: /use current location/i }).click();

  // Step 3: Notifications — skip
  await page.getByRole("button", { name: /^skip$/i }).click();

  // Wait for redirect to home
  await page.waitForURL("/");
}

export const test = base.extend<AppFixtures>({
  /**
   * For settings pages (/settings/general, etc.).
   * These routes are NOT wrapped by OnboardingGuard, so no onboarding needed.
   */
  appPage: async ({ page }, use) => {
    await use(page);
    // Cleanup: wipe local data after each test
    await resetLocalData(page);
  },

  /**
   * For task pages (/, /inbox, /upcoming, /browse, etc.).
   * These are wrapped by OnboardingGuard — completes onboarding on fresh DB.
   */
  taskPage: async ({ page }, use) => {
    // Navigate first so the SQLite Worker/OPFS storage is accessible, then wipe any leftover state
    await page.goto("/");
    await resetLocalData(page);
    await page.evaluate(() => localStorage.clear());
    // Reload into a guaranteed-clean state — OnboardingGuard will redirect to /onboarding
    await page.reload({ waitUntil: "networkidle" });
    // DB is empty so OnboardingGuard always redirects; wait for it (async SQLite read)
    await page.waitForURL("/onboarding", { timeout: 10_000 });
    await completeOnboarding(page);

    await use(page);
    // Post-test cleanup for the next test
    await resetLocalData(page);
    await page.evaluate(() => localStorage.clear());
  },
});

export { expect } from "@playwright/test";
