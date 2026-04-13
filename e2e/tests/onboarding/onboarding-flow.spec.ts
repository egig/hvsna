import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { OnboardingPage } from "../../page-objects/OnboardingPage";
import { resetPouchDB } from "../../helpers/db-reset";
import { mockAladhanAPI } from "../../helpers/api-mocks";

/**
 * Onboarding flow tests (/onboarding)
 *
 * Tests the complete 3-step onboarding process:
 * 1. Language selection (English/Indonesian)
 * 2. Location setup (geolocation or manual timezone)
 * 3. Notification setup (enable or skip)
 *
 * Source: src/modules/onboarding/onboarding.tsx
 */
test.describe("Onboarding Flow", () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ page }) => {
    onboarding = new OnboardingPage(page);
    await mockAladhanAPI(page);

    // Navigate first so IndexedDB is accessible, then reset to a clean state
    await page.goto("/");
    await resetPouchDB(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    // OnboardingGuard redirects a fresh DB to /onboarding
    await onboarding.waitForOnboardingPage();
  });

  test.describe("Language Selection", () => {
    test("shows language selection page on first load", async () => {
      expect(await onboarding.getWelcomeTitle()).toContain("Select Language");
      expect(await onboarding.getCurrentStep()).toBe(1);
      expect(await onboarding.isLanguageStepVisible()).toBe(true);
    });

    test("selecting English advances to location setup", async () => {
      await onboarding.selectLanguage("en");

      expect(await onboarding.getCurrentStep()).toBe(2);
      expect(await onboarding.getLocationSetupTitle()).toContain(
        "Setup Location",
      );
    });

    test("selecting Indonesian advances to location setup", async () => {
      await onboarding.selectLanguage("id");

      expect(await onboarding.getCurrentStep()).toBe(2);
    });

    test("shows visual indicator for selected language after selection", async () => {
      await onboarding.selectLanguage("en");

      // After advancing, language step should be hidden and location step visible
      await expect(
        onboarding.page.locator('[data-testid="language-selection-step"]'),
      ).not.toBeVisible();
      await expect(
        onboarding.page.locator('[data-testid="location-setup-step"]'),
      ).toBeVisible();
    });
  });

  test.describe("Location Setup", () => {
    test.beforeEach(async () => {
      await onboarding.selectLanguage("en");
      expect(await onboarding.getCurrentStep()).toBe(2);
    });

    test("shows location setup page with correct title", async () => {
      expect(await onboarding.getLocationSetupTitle()).toContain(
        "Setup Location",
      );
      expect(await onboarding.getCurrentStep()).toBe(2);
      expect(await onboarding.isLocationStepVisible()).toBe(true);
      expect(await onboarding.isLanguageStepVisible()).toBe(false);
    });

    test("using current location advances to notification setup", async () => {
      // Geolocation is mocked in playwright.config.ts (21.3891, 39.8579)
      await onboarding.useCurrentLocation();

      expect(await onboarding.getCurrentStep()).toBe(3);
      expect(await onboarding.getNotificationSetupTitle()).toContain(
        "Setup Notifications",
      );
    });

    test("manual timezone selection opens modal", async () => {
      await onboarding.openTimezoneModal();

      const modal = onboarding.page.locator('[data-testid="timezone-modal"]');
      await expect(modal).toBeVisible();
    });

    test("manual timezone selection advances to notification setup", async () => {
      await onboarding.selectTimezone("Asia/Riyadh");
      await onboarding.continueWithManualTimezone();

      expect(await onboarding.getCurrentStep()).toBe(3);
      expect(await onboarding.getNotificationSetupTitle()).toContain(
        "Setup Notifications",
      );
    });

    test("back button returns to language selection", async () => {
      await onboarding.clickBackButton();

      expect(await onboarding.getCurrentStep()).toBe(1);
      expect(await onboarding.getWelcomeTitle()).toContain("Select Language");
      expect(await onboarding.isLanguageStepVisible()).toBe(true);
      expect(await onboarding.isLocationStepVisible()).toBe(false);
    });

  });

  test.describe("Notification Setup", () => {
    test.beforeEach(async () => {
      await onboarding.selectLanguage("en");
      await onboarding.useCurrentLocation();
      expect(await onboarding.getCurrentStep()).toBe(3);
    });

    test("shows notification setup page with correct title", async () => {
      expect(await onboarding.getNotificationSetupTitle()).toContain(
        "Setup Notifications",
      );
      expect(await onboarding.getCurrentStep()).toBe(3);
      expect(await onboarding.isNotificationStepVisible()).toBe(true);
      expect(await onboarding.isLocationStepVisible()).toBe(false);
    });

    test("skipping notifications redirects to main app", async () => {
      await onboarding.skipNotifications();

      await onboarding.waitForMainApp();
      await expect(onboarding.page).toHaveURL("/");
    });

    test("enabling notifications redirects to main app", async ({ page }) => {
      await page.context().grantPermissions(["notifications"]);
      await onboarding.enableNotifications();

      await onboarding.waitForMainApp();
      await expect(onboarding.page).toHaveURL("/");
    });

    test("back button returns to location setup", async () => {
      await onboarding.clickBackButton();

      expect(await onboarding.getCurrentStep()).toBe(2);
      expect(await onboarding.getLocationSetupTitle()).toContain(
        "Setup Location",
      );
      expect(await onboarding.isLocationStepVisible()).toBe(true);
      expect(await onboarding.isNotificationStepVisible()).toBe(false);
    });

  });

  test.describe("Complete Flow", () => {
    test("complete onboarding with English, current location, skip notifications", async () => {
      await onboarding.selectLanguage("en");
      expect(await onboarding.getCurrentStep()).toBe(2);

      await onboarding.useCurrentLocation();
      expect(await onboarding.getCurrentStep()).toBe(3);

      await onboarding.skipNotifications();

      await onboarding.waitForMainApp();
      await expect(onboarding.page).toHaveURL("/");
    });

    test("complete onboarding with Indonesian, manual timezone, skip notifications", async () => {
      await onboarding.selectLanguage("id");
      expect(await onboarding.getCurrentStep()).toBe(2);

      await onboarding.selectTimezone("Asia/Jakarta");
      await onboarding.continueWithManualTimezone();
      expect(await onboarding.getCurrentStep()).toBe(3);

      await onboarding.skipNotifications();

      await onboarding.waitForMainApp();
      await expect(onboarding.page).toHaveURL("/");
    });
  });

  test.describe("Step Indicator and Navigation", () => {
    test("step indicator updates correctly through flow", async () => {
      expect(await onboarding.getCurrentStep()).toBe(1);
      expect(await onboarding.isLanguageStepVisible()).toBe(true);

      await onboarding.selectLanguage("en");
      expect(await onboarding.getCurrentStep()).toBe(2);
      expect(await onboarding.isLocationStepVisible()).toBe(true);

      await onboarding.useCurrentLocation();
      expect(await onboarding.getCurrentStep()).toBe(3);
      expect(await onboarding.isNotificationStepVisible()).toBe(true);
    });

    test("back button only appears on steps 2 and 3", async () => {
      // Step 1: No back button
      const backButton = onboarding.page.locator('[data-testid="back-button"]');
      await expect(backButton).not.toBeVisible();

      // Step 2: Back button visible
      await onboarding.selectLanguage("en");
      await expect(backButton).toBeVisible();

      // Step 3: Back button visible
      await onboarding.useCurrentLocation();
      await expect(backButton).toBeVisible();
    });
  });
});
