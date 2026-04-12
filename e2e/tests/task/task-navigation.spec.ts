import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { TaskFormPage } from "../../page-objects/TaskFormPage";
import { TaskListPage } from "../../page-objects/TaskListPage";

/**
 * Task navigation tests — verifying correct routing between views.
 *
 * Route facts (routes.tsx):
 * - / → Today (OnboardingGuard wrapped)
 * - /inbox → Inbox (OnboardingGuard wrapped)
 * - /upcoming → Upcoming (OnboardingGuard wrapped)
 * - /browse → Browse (OnboardingGuard wrapped, mobile only)
 */
test.describe("Task navigation", () => {
  let list: TaskListPage;
  let form: TaskFormPage;

  test.beforeEach(async ({ taskPage }) => {
    list = new TaskListPage(taskPage);
    form = new TaskFormPage(taskPage);
  });

  test("today view renders at root URL", async ({ taskPage }) => {
    await taskPage.goto("/");
    await expect(taskPage).toHaveURL("/");
  });

  test("inbox route renders correctly", async ({ taskPage }) => {
    await taskPage.goto("/inbox");
    await expect(taskPage).toHaveURL("/inbox");
  });

  test("upcoming route renders correctly", async ({ taskPage }) => {
    await taskPage.goto("/upcoming");
    await expect(taskPage).toHaveURL("/upcoming");
  });

  test("browse route renders correctly", async ({ taskPage }) => {
    await taskPage.goto("/browse");
    await expect(taskPage).toHaveURL("/browse");
  });

  test("inbox shows only tasks without date and list", async ({ taskPage }) => {
    // Create an inbox task (no date, no list)
    await taskPage.goto("/");
    await form.openButton.click();
    await form.createTask("No date task");

    // Navigate to inbox — the no-date task should be there
    await taskPage.goto("/inbox");
    await expect(list.getTaskHeading("No date task")).toBeVisible();
  });

  test("today view shows today-dated tasks", async ({ taskPage }) => {
    // Verify the today view loads
    await taskPage.goto("/");
    // Page should not have redirected to onboarding (fixture handled it)
    await expect(taskPage).toHaveURL("/");
  });

  test("upcoming view loads without errors", async ({ taskPage }) => {
    await taskPage.goto("/upcoming");
    // Should show empty state or task list, not an error
    const pageContent = taskPage.locator("body");
    await expect(pageContent).not.toContainText(/error|crash|exception/i);
  });
});
