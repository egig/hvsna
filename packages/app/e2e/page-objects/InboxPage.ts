import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for /inbox.
 * Source: src/screens/{desktop,mobile}/inbox.tsx
 * Shows tasks with no date AND no project assigned.
 */
export class InboxPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/inbox");
    await this.page.waitForLoadState("networkidle");
  }

  get emptyState(): Locator {
    return this.page.getByText(/no tasks/i);
  }
}
