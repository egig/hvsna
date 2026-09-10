import { expect } from "@playwright/test";
import { test } from "../../fixtures/app.fixture";
import { TodayPage } from "../../page-objects/TodayPage";
import { TaskFormPage } from "../../page-objects/TaskFormPage";
import { TaskListPage } from "../../page-objects/TaskListPage";

/**
 * Today Page tests
 *
 * Covers the grouping and ordering logic in:
 *   src/screens/{desktop,mobile}/today.tsx
 *   src/modules/prayer-time-utils.ts — groupTasksByPrayerTimes()
 *
 * Prayer times are computed locally by `adhan` (src/modules/prayer.ts) from the
 * mocked geolocation (21.3891, 39.8579) — no network call.
 *
 * Islamic day order (Maghrib-first):
 *   Maghrib → Isha → Fajr → Sunrise → Dhuhr → Asr
 */
test.describe("Today Page", () => {
  let today: TodayPage;
  let form: TaskFormPage;
  let list: TaskListPage;

  test.beforeEach(async ({ taskPage }) => {
    today = new TodayPage(taskPage);
    form = new TaskFormPage(taskPage);
    list = new TaskListPage(taskPage);
    await today.goto();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  test("shows empty state when no tasks are due today", async () => {
    await expect(today.emptyState).toBeVisible();
  });

  // ── Basic today tasks ───────────────────────────────────────────────────────

  test("task scheduled for today appears on the today page", async () => {
    await form.openButton.click();
    await form.createTaskForToday("Morning walk");

    await today.goto();
    await expect(list.getTaskHeading("Morning walk")).toBeVisible();
  });

  test("task without date does not appear on today page", async () => {
    await form.openButton.click();
    await form.createTask("Inbox only task");

    await today.goto();
    await expect(list.getTaskHeading("Inbox only task")).not.toBeVisible();
  });

  test("completed section appears at the bottom after completing a task", async () => {
    await form.openButton.click();
    await form.createTaskForToday("Task to complete");

    await today.goto();
    await list.completeTask("Task to complete");

    // Completed header should now appear
    await expect(today.completedGroupHeader).toBeVisible();
  });

  test("completed section is collapsed by default", async () => {
    await form.openButton.click();
    await form.createTaskForToday("Hidden completed task");

    await today.goto();
    await list.completeTask("Hidden completed task");

    // The task heading should not be visible (collapsed inside the panel)
    await expect(
      list.getTaskHeading("Hidden completed task"),
    ).not.toBeVisible();
    // But the header trigger is visible
    await expect(today.completedGroupHeader).toBeVisible();
  });

  test("expanding completed section reveals the completed task", async () => {
    await form.openButton.click();
    await form.createTaskForToday("Expandable task");

    await today.goto();
    await list.completeTask("Expandable task");

    // Expand the completed section
    await today.completedGroupHeader.click();

    await expect(list.getTaskHeading("Expandable task")).toBeVisible();
  });

  test("prayer group is expanded by default", async () => {
    await form.openButton.click();
    await form.createTaskWithPrayer("Dhuhr task", "Dhuhr");

    await today.goto();

    // Task is visible (panel open by default)
    await expect(list.getTaskHeading("Dhuhr task")).toBeVisible();
  });
});
