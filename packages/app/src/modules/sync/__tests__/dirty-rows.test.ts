// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestDatabase, tagRow, taskRow } from "@/modules/db/__tests__/test-database";
import type { DbExecutor } from "@/modules/db/executor";
import type { TagRow, TaskRow } from "@/modules/db/database";
import type { SettingsWireRow, TagWireRow, TaskWireRow } from "@/infra/sync/types";
import { applyRemoteRow, clearDirty, findDirty } from "../dirty-rows";

async function insertRawTask(client: DbExecutor, overrides: Partial<TaskRow> = {}) {
  await client.db.tasks.put(taskRow(overrides));
}

async function insertRawTag(client: DbExecutor, overrides: Partial<TagRow> = {}) {
  await client.db.tags.put(tagRow(overrides));
}

async function linkTag(client: DbExecutor, taskId: string, tagId: string) {
  await client.db.task_tags.put({ task_id: taskId, tag_id: tagId });
}

async function tagIdsOf(client: DbExecutor, taskId: string) {
  const links = await client.db.task_tags.where("task_id").equals(taskId).toArray();
  return links.map((link) => link.tag_id);
}

const baseTaskRow: TaskWireRow = {
  id: "task_1",
  name: "Remote task",
  description: null,
  status: 0,
  at_time: null,
  at_epoch_millis: null,
  lat: null,
  lng: null,
  timezone: null,
  recurring_type: null,
  recurring_interval: null,
  recurring_task_id: null,
  hijri_date_offset: null,
  tag_ids: [],
  created_at: 1000,
  updated_at: 1000,
  completed_at: null,
  deleted_at: null,
};

describe("dirty-rows", () => {
  it("findDirty returns only _dirty rows, clearDirty clears them", async () => {
    const client = createTestDatabase();
    await insertRawTask(client, { id: "task_1", _dirty: 1 });
    await insertRawTask(client, { id: "task_2", _dirty: 0 });

    const dirty = await findDirty(client, "tasks", 10);
    expect(dirty.map((r) => r.id)).toEqual(["task_1"]);

    await clearDirty(client, "tasks", dirty);
    expect(await findDirty(client, "tasks", 10)).toEqual([]);
  });

  it("findDirty attaches a task's current tag_ids", async () => {
    const client = createTestDatabase();
    await insertRawTask(client, { id: "task_1", _dirty: 1 });
    await insertRawTag(client, { id: "tag_1" });
    await insertRawTag(client, { id: "tag_2", name: "home" });
    await linkTag(client, "task_1", "tag_1");
    await linkTag(client, "task_1", "tag_2");

    const [dirty] = await findDirty(client, "tasks", 10);
    expect(dirty.tag_ids.sort()).toEqual(["tag_1", "tag_2"]);
  });

  it("applyRemoteRow inserts a new row with _dirty forced to 0", async () => {
    const client = createTestDatabase();

    await applyRemoteRow(client, "tasks", baseTaskRow);

    const stored = await client.db.tasks.get("task_1");
    expect(stored?.name).toBe("Remote task");
    expect(stored?._dirty).toBe(0);
  });

  it("applyRemoteRow replaces task_tags to match the incoming tag_ids", async () => {
    const client = createTestDatabase();
    await insertRawTag(client, { id: "tag_1" });
    await insertRawTag(client, { id: "tag_2", name: "home" });
    await insertRawTask(client, { id: "task_1", _dirty: 0 });
    await linkTag(client, "task_1", "tag_1");

    await applyRemoteRow(client, "tasks", {
      ...baseTaskRow,
      tag_ids: ["tag_2"],
      updated_at: 2000,
    });

    expect(await tagIdsOf(client, "task_1")).toEqual(["tag_2"]);
  });

  it("applyRemoteRow does not touch task_tags when the LWW guard rejects the row", async () => {
    const client = createTestDatabase();
    await insertRawTag(client, { id: "tag_1" });
    await insertRawTask(client, { id: "task_1", updated_at: 5000, _dirty: 1 });
    await linkTag(client, "task_1", "tag_1");

    await applyRemoteRow(client, "tasks", { ...baseTaskRow, tag_ids: [], updated_at: 1000 });

    expect(await tagIdsOf(client, "task_1")).toEqual(["tag_1"]);
  });

  it("overwrites the local row when the remote copy is newer, without touching created_at", async () => {
    const client = createTestDatabase();
    await insertRawTask(client, { name: "Local edit", created_at: 1, updated_at: 1000 });

    await applyRemoteRow(client, "tasks", { ...baseTaskRow, name: "Remote wins", updated_at: 2000 });

    const stored = await client.db.tasks.get("task_1");
    expect(stored?.name).toBe("Remote wins");
    expect(stored?.created_at).toBe(1);
    expect(stored?._dirty).toBe(0);
  });

  it("never clobbers a newer, still-dirty local edit with a stale remote row", async () => {
    const client = createTestDatabase();
    await insertRawTask(client, { name: "Newer local edit", updated_at: 5000, _dirty: 1 });

    await applyRemoteRow(client, "tasks", { ...baseTaskRow, name: "Stale remote", updated_at: 1000 });

    const stored = await client.db.tasks.get("task_1");
    expect(stored?.name).toBe("Newer local edit");
    expect(stored?._dirty).toBe(1);
  });

  it("works for the key/value settings table too", async () => {
    const client = createTestDatabase();
    await client.db.settings.put({ key: "language", value: '"en"', updated_at: 1000, _dirty: 1 });

    expect(await findDirty(client, "settings", 10)).toHaveLength(1);

    const remoteRow: SettingsWireRow = {
      key: "language",
      value: '"id"',
      updated_at: 2000,
    };
    await applyRemoteRow(client, "settings", remoteRow);

    const stored = await client.db.settings.get("language");
    expect(stored?.value).toBe('"id"');
    expect(stored?._dirty).toBe(0);
  });

  it("works for the tags table too", async () => {
    const client = createTestDatabase();
    await insertRawTag(client, { id: "tag_1", _dirty: 1 });

    expect(await findDirty(client, "tags", 10)).toHaveLength(1);

    const remoteRow: TagWireRow = {
      id: "tag_1",
      name: "urgent",
      color: "#EF4444",
      created_at: 1000,
      updated_at: 2000,
      deleted_at: null,
    };
    await applyRemoteRow(client, "tags", remoteRow);

    const stored = await client.db.tags.get("tag_1");
    expect(stored?.color).toBe("#EF4444");
    expect(stored?._dirty).toBe(0);
  });
});


it("does not acknowledge a tag-only edit with an unchanged timestamp", async () => {
  const client = createTestDatabase();
  await insertRawTask(client);
  const uploaded = await findDirty(client, "tasks", 10);
  await insertRawTag(client);
  await linkTag(client, "task_1", "tag_1");
  await clearDirty(client, "tasks", uploaded);
  expect(await findDirty(client, "tasks", 10)).toHaveLength(1);
});

it("rolls back a remote row if replacing its tags fails", async () => {
  const client = createTestDatabase();
  await insertRawTask(client, { _dirty: 0 });
  client.db.task_tags.hook("creating", () => {
    throw new Error("membership failed");
  });
  await expect(applyRemoteRow(client, "tasks", { ...baseTaskRow, name: "Changed", tag_ids: ["tag_1"], updated_at: 2000 }))
    .rejects.toThrow("membership failed");
  expect((await client.db.tasks.toArray()).map((row) => row.name)).toEqual(["Buy milk"]);
});
