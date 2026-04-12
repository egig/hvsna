import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the task creation / edit form.
 *
 * Source: src/modules/task/task-form.tsx
 * - Name input: aria-label={t("task_name")} → "Task name" in English
 * - Submit button: aria-label={t("add_new_task")} → "Add new task" in English
 *   (mobile: round FAB; desktop: "Submit" text button — both have same aria-label)
 */
export class TaskFormPage extends BasePage {
  /** FAB / Add-task button that opens the create form */
  get openButton(): Locator {
    return this.page.getByTestId("fab-add-task");
  }

  get nameInput(): Locator {
    return this.page.getByRole("textbox", { name: /task name/i });
  }

  get submitButton(): Locator {
    return this.page.getByTestId("task-form-submit");
  }

  get repeatButton(): Locator {
    return this.page.getByRole("button", { name: /repeat/i });
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createTask(name: string): Promise<void> {
    await this.fillName(name);
    await this.submit();
  }
}
