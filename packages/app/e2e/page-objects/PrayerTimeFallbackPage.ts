import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for /settings/prayer-time-fallback
 *
 * Source: src/modules/settings/pages/prayer-time-fallback.tsx
 * SimpleTimePicker: button opens a Modal with Hour/Minute <select>s + "Confirm" button
 */
export class PrayerTimeFallbackPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/settings/prayer-time-fallback");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Prayer time pickers ──────────────────────���────────────────────────

  /**
   * Get the SimpleTimePicker trigger button for a given prayer.
   * data-testid="prayer-time-picker-{key}" where key is the lowercase internal key:
   * fajr, sunrise, dzuhr, asr, maghrib, isha
   * @param prayerLabel e.g. "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"
   */
  getPrayerTimeButton(prayerLabel: string): Locator {
    const keyMap: Record<string, string> = {
      fajr: "fajr",
      sunrise: "sunrise",
      dhuhr: "dzuhr",
      dzuhr: "dzuhr",
      asr: "asr",
      maghrib: "maghrib",
      isha: "isha",
    };
    const key = keyMap[prayerLabel.toLowerCase()] ?? prayerLabel.toLowerCase();
    return this.page.getByTestId(`prayer-time-picker-${key}`);
  }

  /**
   * Set a prayer time via the SimpleTimePicker modal.
   * Opens the picker, selects hour and minute, then confirms.
   */
  get timePickerCancelButton(): Locator {
    return this.page.getByTestId("time-picker-cancel");
  }

  get timePickerConfirmButton(): Locator {
    return this.page.getByTestId("time-picker-confirm");
  }

  async setPrayerTime(
    prayerLabel: string,
    hour: number,
    minute: number,
  ): Promise<void> {
    await this.getPrayerTimeButton(prayerLabel).click();

    await this.timePickerConfirmButton.waitFor({ state: "visible" });

    // Select hour and minute from the <select> elements
    await this.page.getByTestId("time-picker-hour").selectOption(String(hour));
    await this.page.getByTestId("time-picker-minute").selectOption(String(minute));

    await this.timePickerConfirmButton.click();

    await this.timePickerConfirmButton.waitFor({ state: "hidden" });

    // Wait for the button to display the new time — this confirms React state updated
    // and gives the async PouchDB write a chance to complete before callers reload
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const displayMinute = String(minute).padStart(2, "0");
    await expect(this.getPrayerTimeButton(prayerLabel)).toContainText(
      `${displayHour}:${displayMinute} ${period}`,
    );
    // Brief additional wait for async PouchDB IndexedDB write to persist
    await this.page.waitForTimeout(500);
  }

  // ── Fetch button ──────────────────────────────────────────────────────

  get fetchButton(): Locator {
    return this.page.getByRole("button", {
      name: /fetch updated prayer times/i,
    });
  }

  // ── Status messages ────────────────────────────────────────────���──────

  /** Warning shown when no location is set */
  get locationRequiredWarning(): Locator {
    return this.page.getByText(/location coordinates must be set/i);
  }

  /** Success message after a successful fetch */
  get fetchSuccessMessage(): Locator {
    return this.page.getByText(/prayer times updated successfully/i);
  }

  /** Error message after a failed fetch */
  get fetchErrorMessage(): Locator {
    return this.page.getByText(/failed to fetch updated prayer times/i);
  }

  /** "How it works" explanation block */
  get howItWorksHeading(): Locator {
    return this.page.getByText(/how it works/i);
  }
}
