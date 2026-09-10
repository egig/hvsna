import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Today view (/).
 * Source: src/screens/{desktop,mobile}/today.tsx
 */
export class TodayPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  get emptyState(): Locator {
    return this.page.getByText(/no tasks scheduled for today/i);
  }

  /**
   * Collapsible trigger for a prayer group header.
   * Matches "Fajr", "Fajr (05:15)", "Maghrib (18:15)", etc.
   */
  getPrayerGroupHeader(prayer: string): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(prayer, "i"),
    });
  }

  /** The "Completed" collapsible section trigger */
  get completedGroupHeader(): Locator {
    return this.page.getByRole("button", { name: /^completed/i });
  }

  /** The "Overdue" collapsible section trigger */
  get overdueGroupHeader(): Locator {
    return this.page.getByRole("button", { name: /^overdue$/i });
  }

  /**
   * Returns the bounding box top position of a prayer group header.
   * Used to verify ordering between groups.
   */
  async getPrayerGroupTop(prayer: string): Promise<number> {
    const box = await this.getPrayerGroupHeader(prayer).boundingBox();
    if (!box)
      throw new Error(`Prayer group "${prayer}" not found or not visible`);
    return box.y;
  }
}
