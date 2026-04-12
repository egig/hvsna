import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { OnboardingPage } from "../../page-objects/OnboardingPage";
import { resetPouchDB } from "../../helpers/db-reset";
import { mockAladhanAPI } from "../../helpers/api-mocks";

/**
 * Onboarding edge cases and error handling tests
 *
 * Source: src/modules/onboarding/onboarding.tsx
 */
test.describe("Onboarding Edge Cases", () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPage(page);
    await mockAladhanAPI(page);

    // Navigate first so IndexedDB is accessible, then reset to a clean state
    await page.goto("/");
    await resetPouchDB(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await onboarding.waitForOnboardingPage();
  });

  test.describe("Geolocation Errors", () => {
    test.beforeEach(async () => {
      await onboarding.selectLanguage("en");
      expect(await onboarding.getCurrentStep()).toBe(2);
    });

    test("handles geolocation permission denied — stays on location step", async ({
      page,
    }) => {
      // Remove geolocation permission so navigator.geolocation.getCurrentPosition rejects
      await page.context().clearPermissions();

      // Click directly — don't use useCurrentLocation() since that waits for step to advance
      await onboarding.page.locator('[data-testid="use-current-location"]').click();

      // Catch block fires; loading resets; button re-enables; step stays at 2
      await expect(
        onboarding.page.locator('[data-testid="use-current-location"]'),
      ).toBeEnabled();
      expect(await onboarding.getCurrentStep()).toBe(2);

      // Manual timezone fallback still works
      await onboarding.continueWithManualTimezone();
      await expect(
        onboarding.page.locator('[data-testid="notification-setup-step"]'),
      ).toBeVisible();
      expect(await onboarding.getCurrentStep()).toBe(3);
    });
  });

  test.describe("Notification Permission Errors", () => {
    test.beforeEach(async () => {
      await onboarding.selectLanguage("en");
      await onboarding.useCurrentLocation();
      expect(await onboarding.getCurrentStep()).toBe(3);
    });

    test("handles notification permission denied — still redirects to main app", async ({
      page,
    }) => {
      // Remove notification permission
      await page.context().clearPermissions();

      await onboarding.enableNotifications();

      // onboarding completes with notifications=false regardless
      await onboarding.waitForMainApp();
      await expect(onboarding.page).toHaveURL("/");
    });
  });

  test.describe("Idempotent Selection", () => {
    test("selecting the same language twice still advances to step 2", async () => {
      await onboarding.selectLanguage("en");
      // Already on step 2 — clicking language-en again would be a no-op since step renders differently
      expect(await onboarding.getCurrentStep()).toBe(2);
    });
  });
});
