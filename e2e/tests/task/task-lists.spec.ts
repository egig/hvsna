import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { BrowsePage } from "../../page-objects/BrowsePage";

/**
 * Task list management tests (/browse, /list/:listId)
 *
 * Source: src/modules/task/browse.tsx, list-detail.tsx, list-form.tsx
 */
test.describe("Task list management", () => {
  let browse: BrowsePage;

  test.beforeEach(async ({ taskPage }) => {
    browse = new BrowsePage(taskPage);
    await browse.goto();
  });

  test("browse page renders", async ({ taskPage }) => {
    await expect(taskPage).toHaveURL("/browse");
  });

  test("creates a new list", async ({ taskPage }) => {
    await browse.createListButton.click();

    // List form input — aria-label or name field
    const nameInput = taskPage
      .getByRole("textbox")
      .filter({ hasText: "" })
      .first();
    await nameInput.fill("Work tasks");

    // Submit the list form
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    // List should appear in browse
    await expect(browse.getListItem("Work tasks")).toBeVisible();
  });

  test("clicking a list navigates to list detail", async ({ taskPage }) => {
    // Create a list first
    await browse.createListButton.click();
    const nameInput = taskPage.getByRole("textbox").first();
    await nameInput.fill("My list");
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    // Click on the list
    await browse.openList("My list");

    // URL should contain /list/
    await expect(taskPage).toHaveURL(/\/list\//);
  });

  test("list detail shows empty state when no tasks", async ({ taskPage }) => {
    // Create a list
    await browse.createListButton.click();
    const nameInput = taskPage.getByRole("textbox").first();
    await nameInput.fill("Empty list");
    await taskPage.getByRole("button", { name: /create|save|submit/i }).last().click();

    await browse.openList("Empty list");

    // Should show empty state
    await expect(taskPage.getByRole("heading", { name: /no tasks/i })).toBeVisible();
  });
});
