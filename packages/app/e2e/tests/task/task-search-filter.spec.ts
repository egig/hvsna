import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { TaskFormPage } from "../../page-objects/TaskFormPage";
import { TaskListPage } from "../../page-objects/TaskListPage";

/**
 * Task search and filter tests (/tasks)
 *
 * Source: src/modules/task/tasks.tsx, task-filter-modal.tsx
 */
test.describe("Task search and filter", () => {
  let form: TaskFormPage;
  let list: TaskListPage;

  test.beforeEach(async ({ taskPage }) => {
    form = new TaskFormPage(taskPage);
    list = new TaskListPage(taskPage);

    // Create test tasks via the today view
    await taskPage.goto("/");

    // Task 1
    await form.openButton.click();
    await form.createTask("Buy apples");
    await taskPage.waitForTimeout(200);

    // Task 2
    await form.openButton.click();
    await form.createTask("Buy oranges");
    await taskPage.waitForTimeout(200);

    // Task 3
    await form.openButton.click();
    await form.createTask("Do laundry");
    await taskPage.waitForTimeout(200);

    // Navigate to the all-tasks view
    await taskPage.goto("/tasks");
  });

  test("tasks page loads and shows all tasks", async () => {
    await expect(list.getTaskHeading("Buy apples")).toBeVisible();
    await expect(list.getTaskHeading("Buy oranges")).toBeVisible();
    await expect(list.getTaskHeading("Do laundry")).toBeVisible();
  });

  test("clearing search shows all tasks again", async ({ taskPage }) => {
    const searchInput = taskPage.getByRole("searchbox").or(
      taskPage.getByPlaceholder(/search/i),
    );
    await searchInput.fill("apples");
    await searchInput.clear();

    await expect(list.getTaskHeading("Buy apples")).toBeVisible();
    await expect(list.getTaskHeading("Buy oranges")).toBeVisible();
    await expect(list.getTaskHeading("Do laundry")).toBeVisible();
  });
});
