import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for /browse.
 * Source: src/modules/task/browse.tsx
 */
export class BrowsePage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/browse");
    await this.page.waitForLoadState("networkidle");
  }

  /** "Create List" button shown in empty state */
  get createListButton(): Locator {
    return this.page.getByRole("button", { name: /create list/i });
  }

  /** List item link/button by name */
  getListItem(name: string): Locator {
    return this.page.getByRole("link", { name }).or(
      this.page.getByText(name, { exact: true }),
    );
  }

  async openList(name: string): Promise<void> {
    await this.getListItem(name).click();
  }
}
