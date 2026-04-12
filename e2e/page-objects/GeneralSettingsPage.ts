import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for /settings/general
 *
 * Source: src/modules/settings/pages/general-settings.tsx
 *
 * Layout:
 * - Language: ListInputSelect → native <select> (first combobox on page)
 * - Location section: label "Location", buttons for enable/get/clear
 * - Timezone: button with current timezone + chevron icon
 * - Manual Date Offset: ListInputSelect → native <select> (second combobox on page)
 */
export class GeneralSettingsPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/settings/general");
    await this.page.waitForLoadState("networkidle");
  }

  // ── Language ──────────────────────────────────────────���───────────────

  /** The language <select> — first combobox on the page */
  get languageSelect(): Locator {
    return this.page.getByRole("combobox").first();
  }

  async selectLanguage(value: "en" | "id"): Promise<void> {
    await this.languageSelect.selectOption(value);
    // Settings save is async — wait for the value to stabilize
    await this.page.waitForTimeout(300);
  }

  // ── Location ──────────────────────────────────────────────────────────

  /** "Enable Location" button shown when location permission not granted */
  get enableLocationButton(): Locator {
    return this.page.getByRole("button", { name: /enable location/i });
  }

  /**
   * Primary location action button — shows "Enable Location" on fresh DB (no saved coords),
   * or "Get Location" once coords are already set. Same data-testid in both states.
   */
  get getLocationButton(): Locator {
    return this.page.getByTestId("location-primary-button");
  }

  /** "Clear Location" button shown when coordinates are set */
  get clearLocationButton(): Locator {
    return this.page.getByRole("button", { name: /clear location/i });
  }

  /** The coordinates display text (e.g. "21.389,39.858") */
  get coordinatesText(): Locator {
    // Coordinates shown as "{lat.toFixed(3)},{lon.toFixed(3)}"
    return this.page.locator("text=/\\d+\\.\\d{3},\\d+\\.\\d{3}/");
  }

  /** "not_set" text shown when no location is configured */
  get notSetText(): Locator {
    return this.page.getByText("not set", { exact: false });
  }

  // ── Timezone ─────────────────────────────────────────────────────────

  /**
   * The timezone toggle button (shows current timezone + chevron).
   * Identified by being inside the timezone section and having a chevron icon.
   */
  get timezoneButton(): Locator {
    // The button is inside the timezone row and is disabled when location-derived
    return this.page
      .locator("button")
      .filter({ has: this.page.locator("svg") })
      .filter({ hasNot: this.page.getByRole("button", { name: /location|clear|enable|get/i }) })
      .last();
  }

  // ── Date Offset ───────────────────────────────────────────────────────

  /** The date offset <select> — second combobox on the page */
  get dateOffsetSelect(): Locator {
    return this.page.getByRole("combobox").last();
  }

  async selectDateOffset(value: "-2" | "-1" | "0" | "1" | "2"): Promise<void> {
    await this.dateOffsetSelect.selectOption(value);
    await this.page.waitForTimeout(300);
  }
}
