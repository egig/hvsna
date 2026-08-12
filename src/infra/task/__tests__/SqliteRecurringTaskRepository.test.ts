// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import { SqliteRecurringTaskRepository } from "../SqliteRecurringTaskRepository";

async function makeRepo() {
  const client = await createTestSqliteClient();
  return { client, repo: new SqliteRecurringTaskRepository(client) };
}

describe("SqliteRecurringTaskRepository", () => {
  it("creates a recurring task template and marks it dirty", async () => {
    const { client, repo } = await makeRepo();

    const rtask = await repo.create({
      name: "Daily standup",
      recurringType: "daily",
      baseDateEpoch: 1000,
    });

    expect(String(rtask.id)).toMatch(/^rtask_/);
    expect(rtask.recurringInterval).toBe(1); // defaulted

    const [row] = await client.run(`SELECT _dirty FROM recurring_tasks WHERE id = ?`, [
      String(rtask.id),
    ]);
    expect(row._dirty).toBe(1);
  });

  it("soft-deletes rather than hard-deleting (unlike the old PouchDB repo)", async () => {
    const { client, repo } = await makeRepo();
    const rtask = await repo.create({
      name: "Weekly review",
      recurringType: "weekly",
      baseDateEpoch: 1000,
    });

    await repo.delete(rtask.id);

    expect(await repo.findById(rtask.id)).toBeNull();
    const [row] = await client.run(
      `SELECT deleted_at, _dirty FROM recurring_tasks WHERE id = ?`,
      [String(rtask.id)]
    );
    expect(row.deleted_at).not.toBeNull();
    expect(row._dirty).toBe(1);
  });

  it("update merges occurrenceExceptions and tags correctly", async () => {
    const { repo } = await makeRepo();
    const rtask = await repo.create({
      name: "Daily standup",
      recurringType: "daily",
      baseDateEpoch: 1000,
      tags: ["work"],
    });

    const updated = await repo.update(rtask.id, {
      occurrenceExceptions: ["2026-01-01"],
    });

    expect(updated.occurrenceExceptions).toEqual(["2026-01-01"]);
    expect(updated.tags).toEqual(["work"]); // untouched
  });

  it("find filters by recurringType and excludes soft-deleted rows", async () => {
    const { repo } = await makeRepo();
    await repo.create({ name: "Daily one", recurringType: "daily", baseDateEpoch: 1000 });
    const weekly = await repo.create({
      name: "Weekly one",
      recurringType: "weekly",
      baseDateEpoch: 1000,
    });
    const deleted = await repo.create({
      name: "Deleted daily",
      recurringType: "daily",
      baseDateEpoch: 1000,
    });
    await repo.delete(deleted.id);

    const dailies = await repo.find({ recurringType: "daily" });
    expect(dailies.map((t) => t.name)).toEqual(["Daily one"]);

    const all = await repo.find();
    expect(all.map((t) => t.id).sort()).toEqual([weekly.id, dailies[0]?.id].sort());
  });
});
