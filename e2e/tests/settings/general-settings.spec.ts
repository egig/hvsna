import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { GeneralSettingsPage } from "../../page-objects/GeneralSettingsPage";

/**
 * General Settings tests (/settings/general)
 *
 * This route is NOT wrapped by OnboardingGuard, so no onboarding bypass needed.
 * Settings are persisted to PouchDB ("hvsna-notes" / "general_settings" doc).
 */
test.describe("General Settings", () => {
  let settingsPage: GeneralSettingsPage;

  test.beforeEach(async ({ appPage }) => {
    settingsPage = new GeneralSettingsPage(appPage);
    await settingsPage.goto();
  });

  test("page loads with language select visible", async () => {
    await expect(settingsPage.languageSelect).toBeVisible();
    // Default language is English
    await expect(settingsPage.languageSelect).toHaveValue("en");
  });

  test("page loads with date offset select visible", async () => {
    await expect(settingsPage.dateOffsetSelect).toBeVisible();
    // Default offset is 0
    await expect(settingsPage.dateOffsetSelect).toHaveValue("0");
  });

  test("page loads with location section visible", async () => {
    await expect(
      settingsPage.page.getByTestId("location-section-label"),
    ).toBeVisible();
  });

  test("changes language to Bahasa Indonesia", async () => {
    await settingsPage.selectLanguage("id");

    // Navbar title should change from "General" to "Umum" (Indonesian)
    await expect(settingsPage.navbarTitle).not.toHaveText("General");
  });

  test("language change persists after reload", async ({ appPage }) => {
    await settingsPage.selectLanguage("id");

    await appPage.reload({ waitUntil: "networkidle" });

    // After reload, language select should still show "id"
    await expect(settingsPage.languageSelect).toHaveValue("id");
  });

  test("changes language back to English", async () => {
    // First switch to Bahasa
    await settingsPage.selectLanguage("id");
    // Then switch back
    await settingsPage.selectLanguage("en");

    await expect(settingsPage.navbarTitle).toHaveText(/general/i);
  });

  test("changes date offset to +1 day", async () => {
    await settingsPage.selectDateOffset("1");
    await expect(settingsPage.dateOffsetSelect).toHaveValue("1");
  });

  test("date offset persists after reload", async ({ appPage }) => {
    await settingsPage.selectDateOffset("1");

    await appPage.reload({ waitUntil: "networkidle" });

    await expect(settingsPage.dateOffsetSelect).toHaveValue("1");
  });

  test("location action button is visible", async () => {
    // Fresh DB: shows "Enable Location"; after coords saved: shows "Get Location"
    // Both share data-testid="location-primary-button"
    await expect(settingsPage.getLocationButton).toBeVisible();
  });

  test("clicking get location populates coordinates", async () => {
    await settingsPage.getLocationButton.click();

    // Wait for coordinates to appear — format: "21.389,39.858"
    await expect(settingsPage.coordinatesText).toBeVisible();
  });

  test("clear location removes coordinates", async () => {
    // First, get the location
    await settingsPage.getLocationButton.click();
    await expect(settingsPage.coordinatesText).toBeVisible();

    // Then clear it
    await settingsPage.clearLocationButton.click();

    // Coordinates should be gone, "not set" text appears
    await expect(settingsPage.coordinatesText).not.toBeVisible();
  });

  test("timezone section is visible", async () => {
    await expect(
      settingsPage.page.getByText("Timezone", { exact: false }),
    ).toBeVisible();
  });

  test("timezone picker opens on button click", async () => {
    // The timezone button is enabled when no location-derived timezone
    // After a fresh DB reset, no coordinate is set, so timezone is user-controlled
    const tzButton = settingsPage.page
      .locator("button")
      .filter({ has: settingsPage.page.locator("svg") })
      .and(settingsPage.page.getByRole("button").filter({ hasText: /\// }));

    await tzButton.first().click();

    // Modal with "Select Time" or timezone picker title should open
    await expect(
      settingsPage.page.getByRole("dialog").or(
        settingsPage.page.getByText(/select timezone/i),
      ),
    ).toBeVisible();
  });
});
