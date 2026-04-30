import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { BrowsePage } from "../../page-objects/BrowsePage";

/**
 * Task project management tests (/browse, /project/:projectId)
 *
 * Source: src/modules/task/browse.tsx, project-detail.tsx, project-form.tsx
 */
test.describe("Task project management", () => {
  let browse: BrowsePage;

  test.beforeEach(async ({ taskPage }) => {
    browse = new BrowsePage(taskPage);
    await browse.goto();
  });

  test("browse page renders", async ({ taskPage }) => {
    await expect(taskPage).toHaveURL("/browse");
  });

  test("creates a new project", async ({ taskPage }) => {
    await browse.createProjectButton.click();

    // Project form input — aria-label or name field
    const nameInput = taskPage
      .getByRole("textbox")
      .filter({ hasText: "" })
      .first();
    await nameInput.fill("Work tasks");

    // Submit the project form
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    // Project should appear in browse
    await expect(browse.getProjectItem("Work tasks")).toBeVisible();
  });

  test("clicking a project navigates to project detail", async ({ taskPage }) => {
    // Create a project first
    await browse.createProjectButton.click();
    const nameInput = taskPage.getByRole("textbox").first();
    await nameInput.fill("My project");
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    // Click on the project
    await browse.openProject("My project");

    // URL should contain /project/
    await expect(taskPage).toHaveURL(/\/project\//);
  });

  test("project detail shows empty state when no tasks", async ({ taskPage }) => {
    // Create a project
    await browse.createProjectButton.click();
    const nameInput = taskPage.getByRole("textbox").first();
    await nameInput.fill("Empty project");
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    await browse.openProject("Empty project");

    // Should show empty state
    await expect(taskPage.getByRole("heading", { name: /no tasks/i })).toBeVisible();
  });
});
