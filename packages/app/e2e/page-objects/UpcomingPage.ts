import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for /upcoming.
 * Source: src/modules/task/upcoming.tsx
 */
export class UpcomingPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/upcoming");
    await this.page.waitForLoadState("networkidle");
  }

  get emptyState(): Locator {
    return this.page.getByText(/no upcoming tasks/i);
  }

  /** Group period heading, e.g. "Tomorrow", "This Week", "This Month" */
  getGroupHeader(label: string): Locator {
    return this.page.getByRole("heading", {
      name: new RegExp(label, "i"),
    });
  }
}
