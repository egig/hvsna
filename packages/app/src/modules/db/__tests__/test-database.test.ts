// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestDatabase, taskRow } from "./test-database";

describe("createTestDatabase", () => {
  it("creates every table", () => {
    const { db } = createTestDatabase();
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      "_sync_state",
      "recurring_task_tags",
      "recurring_tasks",
      "settings",
      "tags",
      "task_tags",
      "tasks",
    ]);
  });

  it("gives each call its own isolated database", async () => {
    const first = createTestDatabase();
    const second = createTestDatabase();
    await first.db.tasks.put(taskRow());
    expect(await first.db.tasks.count()).toBe(1);
    expect(await second.db.tasks.count()).toBe(0);
  });
});
