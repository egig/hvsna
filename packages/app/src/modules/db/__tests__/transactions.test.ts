// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createTestDatabase } from "./test-database";
import { createWebRepositories } from "@/modules/repositories-context";
import {
  updateRecurringSeries,
  promoteTaskToRecurring,
} from "@/modules/task/recurring-task-conversion";

describe("database transactions", () => {
  it("rolls back task, tag creation, and notifications when membership fails", async () => {
    const client = createTestDatabase();
    const repos = createWebRepositories(client);
    const notify = vi.fn();
    repos.writeNotifier.subscribe(notify);
    client.db.task_tags.hook("creating", () => {
      throw new Error("tag write failed");
    });
    await expect(
      repos.taskRepository.create({ name: "Test", tags: ["new"] }),
    ).rejects.toThrow("tag write failed");
    expect(await client.db.tasks.toArray()).toEqual([]);
    expect(await client.db.tags.toArray()).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it("defers notifications from nested repository writes until the outer commit", async () => {
    const client = createTestDatabase();
    const repos = createWebRepositories(client);
    const notify = vi.fn();
    repos.writeNotifier.subscribe(notify);
    await repos.transaction(async ({ taskRepository }) => {
      await taskRepository.create({ name: "Atomic", tags: ["home"] });
      expect(notify).not.toHaveBeenCalled();
    });
    expect(notify).toHaveBeenCalledWith("tasks");
    expect((await client.db.tasks.toArray()).map((row) => row.name)).toEqual(["Atomic"]);
  });

  it("aborts the outer transaction when a nested one fails, even if the error is caught", async () => {
    // IndexedDB has no savepoints — see executor.ts.
    const client = createTestDatabase();
    const effect = vi.fn();
    await expect(
      client.transaction(async (scope) => {
        await client.db.settings.put({ key: "a", value: "1", updated_at: 1, _dirty: 1 });
        scope.afterCommit(effect);
        await scope
          .transaction(async () => {
            throw new Error("rollback inner");
          })
          .catch(() => {});
        await client.db.settings.put({ key: "b", value: "2", updated_at: 1, _dirty: 1 });
      }),
    ).rejects.toThrow();
    expect(await client.db.settings.toArray()).toEqual([]);
    expect(effect).not.toHaveBeenCalled();
  });

  it("restores deleted future tasks and the template when the final series write fails", async () => {
    const client = createTestDatabase();
    const repos = createWebRepositories(client);
    const template = await repos.recurringTaskRepository.create({
      name: "Series",
      recurringType: "daily",
      baseDateEpoch: 1000,
    });
    const task = await repos.taskRepository.create({
      name: "Anchor",
      recurringTaskId: template.id,
      atEpochMillis: 1000,
      tags: [],
    });
    const future = await repos.taskRepository.create({
      name: "Future",
      recurringTaskId: template.id,
      atEpochMillis: 2000,
      tags: [],
    });
    const notify = vi.fn();
    repos.writeNotifier.subscribe(notify);
    client.db.tasks.hook("updating", (mods) => {
      if ((mods as { name?: string }).name === "Broken") throw new Error("final write failed");
    });
    await expect(
      repos.transaction(({ taskRepository, recurringTaskRepository }) =>
        updateRecurringSeries(
          String(task.id),
          { name: "Broken" },
          task,
          { name: "Changed" },
          {
            taskRepository,
            recurringTaskRepository,
            updateTask: (id, input) => taskRepository.update(id, input),
            updateRecurringTask: (id, input) =>
              recurringTaskRepository.update(id, input),
          },
        ),
      ),
    ).rejects.toThrow("final write failed");
    expect((await repos.taskRepository.findById(future.id!))?.name).toBe(
      "Future",
    );
    expect(
      (await repos.recurringTaskRepository.findById(template.id))?.name,
    ).toBe("Series");
    expect(notify).not.toHaveBeenCalled();
  });

  it("rolls back a promotion if linking the original task fails", async () => {
    const client = createTestDatabase();
    const repos = createWebRepositories(client);
    await expect(
      repos.transaction(({ taskRepository, recurringTaskRepository }) =>
        promoteTaskToRecurring(
          "missing",
          {},
          "daily",
          1,
          { name: "Series", recurringType: "daily", baseDateEpoch: 1000 },
          {
            taskRepository,
            createRecurringTask: (input) =>
              recurringTaskRepository.create(input),
            updateTask: (id, input) => taskRepository.update(id, input),
          },
        ),
      ),
    ).rejects.toThrow("not found");
    expect(await repos.recurringTaskRepository.find()).toEqual([]);
  });

  it("rolls back task deletions if deleting the recurring template fails", async () => {
    const client = createTestDatabase();
    const repos = createWebRepositories(client);
    const template = await repos.recurringTaskRepository.create({
      name: "Series",
      recurringType: "daily",
      baseDateEpoch: 1000,
    });
    const task = await repos.taskRepository.create({
      name: "Task",
      recurringTaskId: template.id,
      tags: [],
    });
    client.db.recurring_tasks.hook("updating", (mods) => {
      if ((mods as { deleted_at?: number | null }).deleted_at) {
        throw new Error("template delete failed");
      }
    });
    await expect(
      repos.transaction(async ({ taskRepository, recurringTaskRepository }) => {
        await taskRepository.deletePendingByRecurringTaskId(template.id);
        await recurringTaskRepository.delete(template.id);
      }),
    ).rejects.toThrow("template delete failed");
    expect(await repos.taskRepository.findById(task.id!)).not.toBeNull();
    expect(
      await repos.recurringTaskRepository.findById(template.id),
    ).not.toBeNull();
  });
});
