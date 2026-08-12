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

  /** "Create Project" button shown in empty state */
  get createProjectButton(): Locator {
    return this.page.getByRole("button", { name: /create project/i });
  }

  /** Project item link/button by name */
  getProjectItem(name: string): Locator {
    return this.page.getByRole("link", { name }).or(
      this.page.getByText(name, { exact: true }),
    );
  }

  async openProject(name: string): Promise<void> {
    await this.getProjectItem(name).click();
  }
}
