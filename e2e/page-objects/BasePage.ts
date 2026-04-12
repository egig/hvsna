import type { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(readonly page: Page) {}

  get navbarTitle(): Locator {
    return this.page.getByRole("heading").first();
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }
}
