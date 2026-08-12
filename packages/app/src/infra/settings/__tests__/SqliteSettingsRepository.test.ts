// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestSqliteClient } from "@/modules/sqlite/__tests__/test-sqlite-client";
import { SqliteSettingsRepository } from "../SqliteSettingsRepository";
import type { GeneralSettings } from "@/modules/settings/settings";

async function makeRepo() {
  const client = await createTestSqliteClient();
  return { client, repo: new SqliteSettingsRepository(client) };
}

describe("SqliteSettingsRepository", () => {
  it("returns null when no settings have been saved", async () => {
    const { repo } = await makeRepo();
    expect(await repo.load()).toBeNull();
  });

  it("saves and loads a settings blob, and marks the row dirty", async () => {
    const { client, repo } = await makeRepo();
    const settings = { theme: "dark", language: "en" } as unknown as GeneralSettings;

    await repo.save(settings);
    const loaded = await repo.load();

    expect(loaded).toEqual(settings);
    const [row] = await client.run(`SELECT _dirty FROM settings WHERE id = 'settings'`);
    expect(row._dirty).toBe(1);
  });

  it("save is idempotent (upsert, not insert-only)", async () => {
    const { repo } = await makeRepo();
    await repo.save({ theme: "dark" } as unknown as GeneralSettings);
    await repo.save({ theme: "light" } as unknown as GeneralSettings);

    const loaded = await repo.load();
    expect(loaded).toEqual({ theme: "light" });
  });
});
