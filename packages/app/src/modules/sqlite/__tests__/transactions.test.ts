// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createTestSqliteClient } from "./test-sqlite-client";
import { createWebRepositories } from "@/modules/repositories-context";
import {
  updateRecurringSeries,
  promoteTaskToRecurring,
} from "@/modules/task/recurring-task-conversion";

describe("SQLite transactions", () => {
  it("rolls back task, tag creation, and notifications when membership fails", async () => {
    const client = await createTestSqliteClient();
    const repos = createWebRepositories(client);
    const notify = vi.fn();
    repos.writeNotifier.subscribe(notify);
    await client.exec(`CREATE TRIGGER fail_tag BEFORE INSERT ON task_tags
      BEGIN SELECT RAISE(ABORT, 'tag write failed'); END;`);
    await expect(
      repos.taskRepository.create({ name: "Test", tags: ["new"] }),
    ).rejects.toThrow("tag write failed");
    expect(await client.run("SELECT * FROM tasks")).toEqual([]);
    expect(await client.run("SELECT * FROM tags")).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it("queues outside reads until commit and defers nested notifications", async () => {
    const client = await createTestSqliteClient();
    const repos = createWebRepositories(client);
    const notify = vi.fn();
    repos.writeNotifier.subscribe(notify);
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transaction = repos.transaction(async ({ taskRepository }) => {
      await taskRepository.create({ name: "Atomic", tags: ["home"] });
      expect(notify).not.toHaveBeenCalled();
      started();
      await gate;
    });
    await ready;
    let readFinished = false;
    const read = client.run("SELECT name FROM tasks").then((rows) => {
      readFinished = true;
      return rows;
    });
    await Promise.resolve();
    expect(readFinished).toBe(false);
    release();
    await transaction;
    expect(await read).toEqual([{ name: "Atomic" }]);
    expect(notify).toHaveBeenCalledWith("tasks");
  });

  it("isolates concurrent nested scopes and discards effects from a rolled-back savepoint", async () => {
    const client = await createTestSqliteClient();
    const committed = vi.fn();
    const rolledBack = vi.fn();
    await client.transaction(async (scope) => {
      await Promise.all([
        scope.transaction(async (inner) => {
          await inner.run("INSERT INTO settings VALUES ('a', '1', 1, 1)");
          inner.afterCommit(committed);
        }),
        scope
          .transaction(async (inner) => {
            await inner.run("INSERT INTO settings VALUES ('b', '2', 1, 1)");
            inner.afterCommit(rolledBack);
            throw new Error("rollback inner");
          })
          .catch(() => {}),
      ]);
      expect(committed).not.toHaveBeenCalled();
    });
    expect(await client.run("SELECT key FROM settings")).toEqual([
      { key: "a" },
    ]);
    expect(committed).toHaveBeenCalledOnce();
    expect(rolledBack).not.toHaveBeenCalled();
  });

  it("restores deleted future tasks and the template when the final series write fails", async () => {
    const client = await createTestSqliteClient();
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
    await client.exec(`CREATE TRIGGER fail_edit BEFORE UPDATE ON tasks WHEN NEW.name = 'Broken'
      BEGIN SELECT RAISE(ABORT, 'final write failed'); END;`);
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
    const client = await createTestSqliteClient();
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
    const client = await createTestSqliteClient();
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
    await client.exec(`CREATE TRIGGER fail_delete BEFORE UPDATE ON recurring_tasks WHEN NEW.deleted_at IS NOT NULL
      BEGIN SELECT RAISE(ABORT, 'template delete failed'); END;`);
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
