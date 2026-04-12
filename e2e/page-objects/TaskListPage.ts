import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for task list interactions.
 *
 * Source: src/modules/task/task-list-item.tsx
 * - Status button: data-testid="status-toggle"
 * - Task name: <h3> element
 * - Snackbar undo button: t("undo") → "Undo" in English
 */
export class TaskListPage extends BasePage {
  /** Get a task's <h3> heading by name */
  getTaskHeading(name: string): Locator {
    return this.page.getByRole("heading", { name, level: 3 });
  }

  /** Status toggle button scoped to the row containing the given task name */
  private getStatusToggle(taskName: string): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByRole("heading", { name: taskName, level: 3 }) })
      .getByTestId("status-toggle");
  }

  /** Complete a pending task (status=0) */
  getCompleteButton(taskName: string): Locator {
    return this.getStatusToggle(taskName);
  }

  /** Reopen a completed task (status=1) */
  getReopenButton(taskName: string): Locator {
    return this.getStatusToggle(taskName);
  }

  /** Click on a task row to open the edit form */
  async openTask(taskName: string): Promise<void> {
    await this.getTaskHeading(taskName).click();
  }

  /** Complete a task by clicking its status button */
  async completeTask(taskName: string): Promise<void> {
    await this.getCompleteButton(taskName).click();
  }

  /** Reopen a completed task */
  async reopenTask(taskName: string): Promise<void> {
    await this.getReopenButton(taskName).click();
  }

  /** Undo button in the snackbar */
  get undoButton(): Locator {
    return this.page.getByRole("button", { name: /^undo$/i });
  }

  /** Wait for a task to appear */
  async waitForTask(name: string): Promise<void> {
    await this.getTaskHeading(name).waitFor({ state: "visible" });
  }

  /** Wait for a task to disappear */
  async waitForTaskGone(name: string): Promise<void> {
    await this.getTaskHeading(name).waitFor({ state: "hidden" });
  }
}
