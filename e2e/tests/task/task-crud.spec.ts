import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { TaskFormPage } from "../../page-objects/TaskFormPage";
import { TaskListPage } from "../../page-objects/TaskListPage";
import { InboxPage } from "../../page-objects/InboxPage";

/**
 * Task CRUD tests
 *
 * Key source facts:
 * - FAB button: data-testid="fab-add-task" (layout.tsx)
 * - Task name input: aria-label="Task name" (task-form.tsx)
 * - Submit button: data-testid="task-form-submit" (task-form.tsx, task-form-edit.tsx)
 * - Status toggle: data-testid="status-toggle" (task-list-item.tsx)
 * - Tasks without date/list land in Inbox
 */
test.describe("Task CRUD", () => {
  let form: TaskFormPage;
  let list: TaskListPage;
  let inbox: InboxPage;

  test.beforeEach(async ({ taskPage }) => {
    form = new TaskFormPage(taskPage);
    list = new TaskListPage(taskPage);
    inbox = new InboxPage(taskPage);
  });

  test("creates an inbox task (no date)", async () => {
    await form.openButton.click();
    await form.createTask("Buy groceries");

    // No-date tasks land in inbox, not today — navigate there
    await inbox.goto();
    await expect(list.getTaskHeading("Buy groceries")).toBeVisible();
  });

  test("task heading is visible after creation", async () => {
    await form.openButton.click();
    await form.createTask("Test task heading");

    await inbox.goto();
    await expect(list.getTaskHeading("Test task heading")).toBeVisible();
  });

  test("completes a task — task disappears from inbox", async () => {
    await form.openButton.click();
    await form.createTask("Read book");

    await inbox.goto();
    await list.waitForTask("Read book");

    // Click the status toggle
    await list.completeTask("Read book");

    // Inbox only shows status=0 tasks — completed task is removed from the list
    await expect(list.getTaskHeading("Read book")).not.toBeVisible();
    // Snackbar confirms the completion happened
    await expect(list.undoButton).toBeVisible();
  });

  test("snackbar appears after completing a task", async () => {
    await form.openButton.click();
    await form.createTask("Snackbar test");

    await inbox.goto();
    await list.completeTask("Snackbar test");

    // Snackbar shows status change message and Undo button
    await expect(list.undoButton).toBeVisible();
  });

  test("undo restores a completed task to inbox", async () => {
    await form.openButton.click();
    await form.createTask("Undo test");

    await inbox.goto();
    await list.completeTask("Undo test");
    // Task disappears from inbox after completion
    await expect(list.getTaskHeading("Undo test")).not.toBeVisible();

    // Click undo — task should reappear in inbox (status back to 0)
    await list.undoButton.click();
    await expect(list.getTaskHeading("Undo test")).toBeVisible();
  });

  test("opens edit form on task name click", async ({ taskPage }) => {
    await form.openButton.click();
    await form.createTask("Edit me");

    await inbox.goto();
    await list.openTask("Edit me");

    // The edit form should appear with the task name pre-filled
    await expect(taskPage.getByRole("textbox", { name: /task name/i })).toBeVisible();
  });

  test("edits a task name", async () => {
    await form.openButton.click();
    await form.createTask("Old name");

    await inbox.goto();
    await list.openTask("Old name");

    // Clear and retype in the edit form's name input
    await form.nameInput.clear();
    await form.nameInput.fill("New name");

    // Submit the edit form
    await form.submit();

    // New name should be visible, old name gone
    await expect(list.getTaskHeading("New name")).toBeVisible();
    await expect(list.getTaskHeading("Old name")).not.toBeVisible();
  });
});
