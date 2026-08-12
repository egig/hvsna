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

  /** Opens the date picker and selects today using the "Today" quick-select (immediately confirms). */
  async selectTodayDate(): Promise<void> {
    await this.page.getByTestId("date-prayer-input-button").click();
    // "Today" quick-select calls onConfirm directly — no separate confirm needed
    await this.page.getByRole("button", { name: /^today$/i }).click();
  }

  /**
   * Opens the calendar, sets a prayer time, then uses the "Today" quick-select to confirm.
   *
   * Flow:
   * 1. Open calendar modal
   * 2. Click today's cell in the Hijri grid — enables the "Time" button (disabled until a date is temp-selected)
   * 3. Enter the time sub-view
   * 4. Click the prayer toggle — auto-confirms the time selection and returns to the date view
   * 5. Click the "Today" quick-select shortcut — it always stays in the visible date-view Activity
   *    and calls onConfirm(today, tempTime, tempPrayerTime) which includes the chosen prayer.
   *
   * Why not use calendar-confirm-button: after the prayer toggle fires, the CalendarModal's
   * Activity transitions from "time" (visible) → "date" (visible). During that transition the
   * confirm button may not yet receive click events, causing the prayer time to be silently lost.
   * The "Today" shortcut lives permanently in the date-view Activity and is always interactive.
   */
  async selectTodayWithPrayer(prayer: string): Promise<void> {
    await this.page.getByTestId("date-prayer-input-button").click();
    // Click today's grid cell to enable the (otherwise disabled) "Time" button
    await this.page.getByTestId("calendar-today-button").click();
    // Open the time sub-view
    await this.page.getByRole("button", { name: /^time$/i }).click();
    // Select the prayer toggle (prayer-tab is the default; this auto-confirms and returns to date view)
    await this.page.getByRole("button", { name: new RegExp(`^${prayer}$`, "i") }).click();
    // Use "Today" quick-select to confirm — passes tempPrayerTime through onConfirm
    await this.page.getByRole("button", { name: /^today$/i }).click();
  }

  /** Creates a task for today with a prayer time. */
  async createTaskWithPrayer(name: string, prayer: string): Promise<void> {
    await this.fillName(name);
    await this.selectTodayWithPrayer(prayer);
    await this.submit();
  }

  /** Creates a task for today (no prayer, no specific time). */
  async createTaskForToday(name: string): Promise<void> {
    await this.fillName(name);
    await this.selectTodayDate();
    await this.submit();
  }
}
