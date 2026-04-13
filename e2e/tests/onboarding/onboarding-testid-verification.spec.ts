import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { OnboardingPage } from "../../page-objects/OnboardingPage";
import { mockAladhanAPI } from "../../helpers/api-mocks";

/**
 * Simple test to verify data-testid implementation works
 * Tests the onboarding component without database reset
 */
test.describe("Onboarding TestId Verification", () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ page }) => {
    await mockAladhanAPI(page);
    onboarding = new OnboardingPage(page);
    
    // Navigate to onboarding without database reset
    await page.goto("/onboarding");
    await onboarding.waitForOnboardingPage();
  });

  test("verifies all data-testid attributes are present", async () => {
    // Check language selection step
    await expect(onboarding.page.locator('[data-testid="language-selection-step"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="welcome-title"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="language-en"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="language-id"]')).toBeVisible();
    
    // Check step indicators
    await expect(onboarding.page.locator('[data-testid="step-indicator"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="step-1"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="step-2"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="step-3"]')).toBeVisible();
  });

  test("verifies language selection using testId", async () => {
    // Select English using testId
    await onboarding.selectLanguage("en");
    
    // Should advance to location step
    await expect(onboarding.page.locator('[data-testid="location-setup-step"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="location-title"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="use-current-location"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="manual-timezone-section"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="timezone-picker-button"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="selected-timezone"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="continue-timezone"]')).toBeVisible();

    // Check back button appears
    await expect(onboarding.page.locator('[data-testid="back-button"]')).toBeVisible();
  });

  test("verifies location setup using testId", async () => {
    // First advance to location step
    await onboarding.selectLanguage("en");
    
    // Use current location
    await onboarding.useCurrentLocation();
    
    // Should advance to notification step
    await expect(onboarding.page.locator('[data-testid="notification-setup-step"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="notification-title"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="enable-notifications"]')).toBeVisible();
    await expect(onboarding.page.locator('[data-testid="skip-notifications"]')).toBeVisible();
  });

  test("verifies timezone modal using testId", async () => {
    // First advance to location step
    await onboarding.selectLanguage("en");
    
    // Open timezone modal
    await onboarding.openTimezoneModal();
    
    // Check modal is visible with testId
    await expect(onboarding.page.locator('[data-testid="timezone-modal"]')).toBeVisible();
    
    // Check some timezone options have testId (they should be generated)
    const firstTimezoneOption = onboarding.page.locator('[data-testid^="timezone-option-"]').first();
    await expect(firstTimezoneOption).toBeVisible();
  });

  test("verifies step navigation using testId", async () => {
    // Start at step 1
    await expect(onboarding.page.locator('[data-testid="language-selection-step"]')).toBeVisible();
    expect(await onboarding.getCurrentStep()).toBe(1);

    // Advance to step 2 — wait for content to appear before checking step number
    await onboarding.selectLanguage("en");
    await expect(onboarding.page.locator('[data-testid="location-setup-step"]')).toBeVisible();
    expect(await onboarding.getCurrentStep()).toBe(2);

    // Go back to step 1
    await onboarding.clickBackButton();
    await expect(onboarding.page.locator('[data-testid="language-selection-step"]')).toBeVisible();
    expect(await onboarding.getCurrentStep()).toBe(1);
  });
});
