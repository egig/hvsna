// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import { SqliteTaskRepository } from "../SqliteTaskRepository";
import { SqliteTagRepository } from "@/infra/tag/SqliteTagRepository";
import { createWriteNotifier } from "@/modules/sync/write-notifier";

async function makeRepo() {
  const client = await createTestSqliteClient();
  const writeNotifier = createWriteNotifier();
  const tagRepo = new SqliteTagRepository(client, writeNotifier);
  return { client, writeNotifier, repo: new SqliteTaskRepository(client, tagRepo, writeNotifier) };
}

describe("SqliteTaskRepository", () => {
  it("creates a task and marks it dirty", async () => {
    const { client, repo } = await makeRepo();

    const task = await repo.create({ name: "Buy milk", tags: ["errands"] });

    expect(task.id).toMatch(/^task_/);
    expect(task.status).toBe(0);
    expect(task.tags).toEqual(["errands"]);

    const [row] = await client.run(`SELECT _dirty FROM tasks WHERE id = ?`, [String(task.id)]);
    expect(row._dirty).toBe(1);

    const tagRows = await client.run(
      `SELECT tags.name FROM task_tags JOIN tags ON tags.id = task_tags.tag_id WHERE task_tags.task_id = ?`,
      [String(task.id)]
    );
    expect(tagRows.map((r) => r.name)).toEqual(["errands"]);
  });

  it("findById returns null for soft-deleted tasks", async () => {
    const { repo } = await makeRepo();
    const task = await repo.create({ name: "Buy milk", tags: [] });

    await repo.delete(task.id!);

    expect(await repo.findById(task.id!)).toBeNull();
  });

  it("update merges only provided fields and re-dirties the row", async () => {
    const { client, repo } = await makeRepo();
    const task = await repo.create({ name: "Buy milk", description: "2%", tags: [] });
    await client.run(`UPDATE tasks SET _dirty = 0 WHERE id = ?`, [String(task.id)]);

    const updated = await repo.update(task.id!, { name: "Buy oat milk" });

    expect(updated.name).toBe("Buy oat milk");
    expect(updated.description).toBe("2%"); // untouched field preserved
    const [row] = await client.run(`SELECT _dirty FROM tasks WHERE id = ?`, [String(task.id)]);
    expect(row._dirty).toBe(1);
  });

  it("update with removeTime clears atTime", async () => {
    const { repo } = await makeRepo();
    const task = await repo.create({ name: "Buy milk", atTime: "09:00", tags: [] });

    const updated = await repo.update(task.id!, { removeTime: true });

    expect(updated.atTime).toBe("");
  });

  it("completeTask sets status=1 and completedAt; reopenTask reverses it", async () => {
    const { repo } = await makeRepo();
    const task = await repo.create({ name: "Buy milk", tags: [] });

    const completed = await repo.completeTask(task.id!);
    expect(completed.status).toBe(1);
    expect(completed.completedAt).toBeTypeOf("number");

    const reopened = await repo.reopenTask(task.id!);
    expect(reopened.status).toBe(0);
    expect(reopened.completedAt).toBeUndefined();
  });

  it("find filters by status and excludes soft-deleted rows", async () => {
    const { repo } = await makeRepo();
    const a = await repo.create({ name: "Pending", tags: [] });
    const b = await repo.create({ name: "Done", tags: [] });
    await repo.completeTask(b.id!);
    const c = await repo.create({ name: "Deleted", tags: [] });
    await repo.delete(c.id!);

    const pending = await repo.find({ status: 0 });
    expect(pending.map((t) => t.name)).toEqual(["Pending"]);

    const all = await repo.find();
    expect(all.map((t) => t.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("find filters by tags via the tags/task_tags join", async () => {
    const { repo } = await makeRepo();
    await repo.create({ name: "Tagged", tags: ["work", "urgent"] });
    await repo.create({ name: "Untagged", tags: [] });

    const results = await repo.find({ tags: ["urgent"] });

    expect(results.map((t) => t.name)).toEqual(["Tagged"]);
  });

  it("findByRecurringTaskId and deletePendingByRecurringTaskId only touch pending instances", async () => {
    const { repo } = await makeRepo();
    const pending = await repo.create({
      name: "Instance 1",
      tags: [],
      recurringTaskId: "rtask_1",
    });
    const completed = await repo.create({
      name: "Instance 2",
      tags: [],
      recurringTaskId: "rtask_1",
    });
    await repo.completeTask(completed.id!);

    const before = await repo.findByRecurringTaskId("rtask_1");
    expect(before).toHaveLength(2);

    await repo.deletePendingByRecurringTaskId("rtask_1");

    expect(await repo.findById(pending.id!)).toBeNull();
    expect(await repo.findById(completed.id!)).not.toBeNull();
  });

  it("update leaves tags untouched when input.tags is omitted, and replaces them when provided", async () => {
    const { repo } = await makeRepo();
    const task = await repo.create({ name: "Buy milk", tags: ["errands"] });

    const untouched = await repo.update(task.id!, { name: "Buy oat milk" });
    expect(untouched.tags).toEqual(["errands"]);

    const replaced = await repo.update(task.id!, { tags: ["groceries"] });
    expect(replaced.tags).toEqual(["groceries"]);

    const cleared = await repo.update(task.id!, { tags: null });
    expect(cleared.tags).toBeNull();
  });

  it("reuses the same underlying tag row across tasks with the same normalized name", async () => {
    const { client, repo } = await makeRepo();
    await repo.create({ name: "Task A", tags: [" Work "] });
    await repo.create({ name: "Task B", tags: ["WORK"] });

    const tagRows = await client.run(`SELECT id, name FROM tags`);
    expect(tagRows).toHaveLength(1);
    expect(tagRows[0].name).toBe("work");
  });

  it("findByHijriDate always returns [] (matches pre-existing behavior — see code comment)", async () => {
    const { repo } = await makeRepo();
    await repo.create({ name: "Task", tags: [] });

    expect(await repo.findByHijriDate("1447-01-01")).toEqual([]);
  });

  it("notifies the write notifier on create/update/delete/completeTask/reopenTask, and not on reads", async () => {
    const { repo, writeNotifier } = await makeRepo();
    const notified: string[] = [];
    writeNotifier.subscribe((table) => notified.push(table));

    const task = await repo.create({ name: "Buy milk", tags: [] });
    expect(notified).toEqual(["tasks"]);

    await repo.update(task.id!, { name: "Buy oat milk" });
    expect(notified).toEqual(["tasks", "tasks"]);

    await repo.completeTask(task.id!);
    expect(notified).toEqual(["tasks", "tasks", "tasks"]);

    await repo.reopenTask(task.id!);
    expect(notified).toEqual(["tasks", "tasks", "tasks", "tasks"]);

    await repo.delete(task.id!);
    expect(notified).toEqual(["tasks", "tasks", "tasks", "tasks", "tasks"]);

    notified.length = 0;
    await repo.find();
    await repo.findById(task.id!);
    expect(notified).toEqual([]);
  });
});
