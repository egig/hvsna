import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { PrayerTimeFallbackPage } from "../../page-objects/PrayerTimeFallbackPage";
import { GeneralSettingsPage } from "../../page-objects/GeneralSettingsPage";
import { mockAladhanAPIError } from "../../helpers/api-mocks";

/**
 * Prayer Time Fallback settings tests (/settings/prayer-time-fallback)
 *
 * Source: src/modules/settings/pages/prayer-time-fallback.tsx
 * SimpleTimePicker: button → modal (Hour/Minute selects) → "Confirm" button
 */
test.describe("Prayer Time Fallback", () => {
  let prayerPage: PrayerTimeFallbackPage;

  test.beforeEach(async ({ appPage }) => {
    prayerPage = new PrayerTimeFallbackPage(appPage);
    await prayerPage.goto();
  });

  test("page loads with all 6 prayer labels visible", async () => {
    await expect(prayerPage.page.getByText(/fajr/i)).toBeVisible();
    await expect(prayerPage.page.getByText(/sunrise/i)).toBeVisible();
    // "Dhuhr" is shown for the key "dzuhr" via t("dhuhr")
    await expect(prayerPage.page.getByText(/dhuhr|dzuhr/i)).toBeVisible();
    await expect(prayerPage.page.getByText(/asr/i)).toBeVisible();
    await expect(prayerPage.page.getByText(/maghrib/i)).toBeVisible();
    await expect(prayerPage.page.getByText(/isha/i)).toBeVisible();
  });

  test("page loads with 6 time picker buttons visible", async () => {
    // Each SimpleTimePicker renders a button showing the formatted time (e.g., "5:00 AM")
    const prayerKeys = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    for (const prayer of prayerKeys) {
      await expect(prayerPage.getPrayerTimeButton(prayer)).toBeVisible();
    }
  });

  test("fetch button is disabled without location", async () => {
    // No location set in fresh DB → fetch button should be disabled
    await expect(prayerPage.fetchButton).toBeDisabled();
  });

  test("location required warning visible without location", async () => {
    await expect(prayerPage.locationRequiredWarning).toBeVisible();
  });

  test("how it works explanation block is visible", async () => {
    await expect(prayerPage.howItWorksHeading).toBeVisible();
  });

  test("can open Fajr time picker modal", async () => {
    await prayerPage.getPrayerTimeButton("Fajr").click();
    await expect(prayerPage.timePickerConfirmButton).toBeVisible();
    // Close it
    await prayerPage.timePickerCancelButton.click();
  });

  test("can edit Fajr prayer time", async () => {
    // Set Fajr to 05:30
    await prayerPage.setPrayerTime("Fajr", 5, 30);

    // Button should now display "5:30 AM"
    await expect(prayerPage.getPrayerTimeButton("Fajr")).toContainText("5:30 AM");
  });

  test("can cancel time picker without changing value", async () => {
    // Record current Fajr display
    const before = await prayerPage.getPrayerTimeButton("Fajr").textContent();

    // Open picker, change value, then cancel
    await prayerPage.getPrayerTimeButton("Fajr").click();
    await prayerPage.timePickerConfirmButton.waitFor({ state: "visible" });
    await prayerPage.page.getByTestId("time-picker-hour").selectOption("3");
    await prayerPage.timePickerCancelButton.click();

    // Value should be unchanged
    await expect(prayerPage.getPrayerTimeButton("Fajr")).toContainText(
      before ?? "",
    );
  });

  test.describe("with location set", () => {
    test.beforeEach(async ({ appPage }) => {
      // Set location via general settings first
      const generalSettings = new GeneralSettingsPage(appPage);
      await generalSettings.goto();
      await generalSettings.getLocationButton.click();
      await expect(generalSettings.coordinatesText).toBeVisible();

      // Now navigate to prayer time fallback
      await prayerPage.goto();
    });

    test("fetch button is enabled when location is set", async () => {
      await expect(prayerPage.fetchButton).toBeEnabled();
    });

    test("location required warning hidden when location is set", async () => {
      await expect(prayerPage.locationRequiredWarning).not.toBeVisible();
    });

    test("fetch updates prayer times and shows success message", async () => {
      // Aladhan API is already mocked to return Fajr=05:15
      await prayerPage.fetchButton.click();

      // Wait for success message
      await expect(prayerPage.fetchSuccessMessage).toBeVisible();

      // Fajr should now display "5:15 AM"
      await expect(prayerPage.getPrayerTimeButton("Fajr")).toContainText(
        "5:15 AM",
      );
    });

    test("fetch error shows error message", async ({ appPage }) => {
      // Override mock to return error for this test
      await mockAladhanAPIError(appPage);

      await prayerPage.fetchButton.click();

      await expect(prayerPage.fetchErrorMessage).toBeVisible();
    });
  });
});
