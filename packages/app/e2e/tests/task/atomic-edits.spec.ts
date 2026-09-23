import { expect, test, type Page } from "@playwright/test";

// Fresh Playwright contexts have their own IndexedDB database. These regressions
// exercise the current routes directly (there is no onboarding route).
async function openCreate(page: Page, name: string) {
  await page.goto("/today");
  await page.getByTestId("fab-add-task").click();
  await page.getByRole("textbox", { name: /task name/i }).fill(name);
}

async function confirmRepeat(page: Page, label: RegExp) {
  await page.getByTestId("repeat-list-button").click();
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByTestId("repeat-confirm-button").click();
  await page.getByTestId("calendar-confirm-button").click();
}

test("persists a task and its tags through an edit and browser reload", async ({
  page,
}) => {
  await openCreate(page, "Atomic task #home");
  await page.getByRole("button", { name: /create #home/i }).click();
  await page.getByTestId("task-form-submit").click();
  await expect(
    page.getByRole("textbox", { name: /task name/i }),
  ).not.toBeVisible();
  const heading = page.getByRole("heading", {
    name: "Atomic task",
    exact: true,
  });
  await expect(heading).toBeVisible();
  await heading.click();
  const title = page.getByRole("textbox", { name: /task name/i });
  await expect(title).toBeEnabled();
  await title.fill("Updated task");
  await page.getByTestId("task-form-submit").click();
  await expect(title).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Updated task", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("#home", { exact: true })).toBeVisible();
});

test("removes repeat from a virtual occurrence through the scope dialog", async ({
  page,
}) => {
  await openCreate(page, "Recurring task");
  await page.getByTestId("date-prayer-input-button").click();
  await page.getByTestId("calendar-today-button").click();
  await confirmRepeat(page, /^every day$/i);
  await page.getByTestId("task-form-submit").click();
  await expect(
    page.getByRole("textbox", { name: /task name/i }),
  ).not.toBeVisible();
  const heading = page.getByRole("heading", {
    name: "Recurring task",
    exact: true,
  });
  await expect(heading).toBeVisible();
  await heading.click();
  await expect(page.getByRole("textbox", { name: /task name/i })).toBeEnabled();
  await page.getByTestId("date-prayer-input-button").click();
  await confirmRepeat(page, /^no repeat$/i);
  await page.getByTestId("task-form-submit").click();
  await page.getByRole("button", { name: /^this task only/i }).click();
  await expect(
    page.getByRole("textbox", { name: /task name/i }),
  ).not.toBeVisible();
  await page.reload();
  await expect(heading).toHaveCount(1);
  await heading.click();
  await page.getByTestId("date-prayer-input-button").click();
  await expect(page.getByTestId("repeat-list-button")).toHaveText("Repeat");
});
