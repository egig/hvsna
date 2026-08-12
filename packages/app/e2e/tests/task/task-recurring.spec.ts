import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { TaskFormPage } from "../../page-objects/TaskFormPage";
import { TaskListPage } from "../../page-objects/TaskListPage";

/**
 * Recurring task tests
 *
 * Source: src/modules/task/recurring-task.ts, repeat-selector-modal.tsx
 *
 * The repeat flow lives inside CalendarModal, not directly in the task form:
 *   1. Click data-testid="date-prayer-input-button" → opens CalendarModal
 *   2. Click data-testid="calendar-today-button" → selects today → enables Repeat
 *   3. Click data-testid="repeat-list-button" → opens repeat view
 *   4. Choose a repeat pattern
 */
test.describe("Recurring tasks", () => {
  let form: TaskFormPage;
  let list: TaskListPage;

  test.beforeEach(async ({ taskPage }) => {
    form = new TaskFormPage(taskPage);
    list = new TaskListPage(taskPage);
    await taskPage.goto("/");
  });

  test("calendar modal opens from task form", async ({ taskPage }) => {
    await form.openButton.click();

    await taskPage.getByTestId("date-prayer-input-button").click();

    // CalendarModal should be visible with the today button
    await expect(taskPage.getByTestId("calendar-today-button")).toBeVisible();
  });

  test("repeat button is enabled after selecting a date", async ({ taskPage }) => {
    await form.openButton.click();
    await taskPage.getByTestId("date-prayer-input-button").click();

    // Select today — this enables the Repeat list item
    await taskPage.getByTestId("calendar-today-button").click();

    await expect(taskPage.getByTestId("repeat-list-button")).toBeEnabled();
  });

  test("repeat selector opens after selecting a date", async ({ taskPage }) => {
    await form.openButton.click();
    await taskPage.getByTestId("date-prayer-input-button").click();
    await taskPage.getByTestId("calendar-today-button").click();
    await taskPage.getByTestId("repeat-list-button").click();

    // Repeat view should show repeat pattern options
    await expect(
      taskPage.getByText(/daily|weekly|monthly|none/i).first(),
    ).toBeVisible();
  });

});
