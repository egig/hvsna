// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import { SqliteTagRepository } from "../SqliteTagRepository";
import { createWriteNotifier } from "@/modules/sync/write-notifier";

async function makeRepo() {
  const client = await createTestSqliteClient();
  const writeNotifier = createWriteNotifier();
  return { client, writeNotifier, repo: new SqliteTagRepository(client, writeNotifier) };
}

describe("SqliteTagRepository", () => {
  it("creates tags on demand when tasks are tagged, normalizing the name", async () => {
    const { repo } = await makeRepo();

    await repo.setTaskTags("task_1", [" Work ", "URGENT"]);

    const all = await repo.findAll();
    expect(all.map((t) => t.name).sort()).toEqual(["urgent", "work"]);
    expect(all.every((t) => t.color)).toBe(true);
  });

  it("reuses the same tag row across entities with the same normalized name", async () => {
    const { client, repo } = await makeRepo();

    await repo.setTaskTags("task_1", ["work"]);
    await repo.setTaskTags("task_2", ["Work"]);

    const rows = await client.run(`SELECT id FROM tags WHERE name = 'work'`);
    expect(rows).toHaveLength(1);
  });

  it("counts only non-deleted tasks, not recurring task templates", async () => {
    const { client, repo } = await makeRepo();
    await client.run(
      `INSERT INTO tasks (id, name, status, created_at, updated_at) VALUES ('task_1','A',0,1,1), ('task_2','B',0,1,1)`
    );
    await repo.setTaskTags("task_1", ["work"]);
    await repo.setTaskTags("task_2", ["work"]);
    await repo.setRecurringTaskTags("rtask_1", ["work"]);

    const [work] = await repo.findAll();
    expect(work.count).toBe(2);
  });

  it("setTaskTags replaces the full tag set on repeated calls", async () => {
    const { repo } = await makeRepo();

    await repo.setTaskTags("task_1", ["a", "b"]);
    await repo.setTaskTags("task_1", ["b", "c"]);

    const tagMap = await repo.getTagsForTasks(["task_1"]);
    expect(tagMap.get("task_1")).toEqual(["b", "c"]);
  });

  it("update renames a tag and rejects colliding with another tag's name via the unique index", async () => {
    const { repo } = await makeRepo();
    await repo.setTaskTags("task_1", ["work"]);
    await repo.setTaskTags("task_2", ["home"]);
    const [home, work] = (await repo.findAll()).sort((a, b) => a.name.localeCompare(b.name));

    const renamed = await repo.update(work.id, { name: "office" });
    expect(renamed.name).toBe("office");

    await expect(repo.update(home.id, { name: "office" })).rejects.toThrow();
  });

  it("update changes color without touching name", async () => {
    const { repo } = await makeRepo();
    await repo.setTaskTags("task_1", ["work"]);
    const [work] = await repo.findAll();

    const updated = await repo.update(work.id, { color: "#ff0000" });
    expect(updated.color).toBe("#ff0000");
    expect(updated.name).toBe("work");
  });

  it("delete removes the tag from every task/recurring task and frees the name for reuse", async () => {
    const { repo } = await makeRepo();
    await repo.setTaskTags("task_1", ["work"]);
    await repo.setRecurringTaskTags("rtask_1", ["work"]);
    const [work] = await repo.findAll();

    await repo.delete(work.id);

    expect(await repo.findAll()).toEqual([]);
    expect((await repo.getTagsForTasks(["task_1"])).get("task_1")).toBeUndefined();
    expect((await repo.getTagsForRecurringTasks(["rtask_1"])).get("rtask_1")).toBeUndefined();

    // name is free again
    await repo.setTaskTags("task_2", ["work"]);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).not.toBe(work.id);
  });

  it("getTagsForTasks returns an empty map for an empty id list", async () => {
    const { repo } = await makeRepo();
    expect(await repo.getTagsForTasks([])).toEqual(new Map());
  });

  it("notifies the write notifier on update/delete, but not on setTaskTags/setRecurringTaskTags", async () => {
    const { repo, writeNotifier } = await makeRepo();
    const notified: string[] = [];
    writeNotifier.subscribe((table) => notified.push(table));

    // Membership rides on the owning task/recurring-task row's own dirty
    // flag (see dirty-rows.ts) — SqliteTagRepository itself must not notify
    // for these, or a tag-only write would be double-counted against the
    // caller's own notify.
    await repo.setTaskTags("task_1", ["work"]);
    await repo.setRecurringTaskTags("rtask_1", ["work"]);
    expect(notified).toEqual([]);

    const [work] = await repo.findAll();
    await repo.update(work.id, { color: "#ff0000" });
    expect(notified).toEqual(["tags"]);

    await repo.delete(work.id);
    expect(notified).toEqual(["tags", "tags"]);
  });
});
