import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Today view (/).
 * Source: src/modules/task/today.tsx
 */
export class TodayPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  /** FAB button to open the create task form */
  get addTaskFab(): Locator {
    // The FAB is outside the form — it opens the task form panel
    return this.page.getByRole("button", { name: /add new task/i }).first();
  }

  get emptyState(): Locator {
    return this.page.getByText(/no tasks/i);
  }

  /** Prayer group collapsible header, e.g. "Fajr" or "Fajr (05:15)" */
  getPrayerGroupHeader(prayer: string): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(prayer, "i"),
    });
  }
}
