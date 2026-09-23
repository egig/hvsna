// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/modules/db/__tests__/test-database";
import { DexieSettingsRepository } from "../DexieSettingsRepository";
import type { GeneralSettings } from "@/modules/settings/settings";
import { createWriteNotifier } from "@/modules/sync/write-notifier";

async function makeRepo() {
  const client = createTestDatabase();
  const writeNotifier = createWriteNotifier();
  return { client, writeNotifier, repo: new DexieSettingsRepository(client, writeNotifier) };
}

describe("DexieSettingsRepository", () => {
  it("returns null when no settings have been saved", async () => {
    const { repo } = await makeRepo();
    expect(await repo.load()).toBeNull();
  });

  it("saves and loads settings as one row per key, and marks rows dirty", async () => {
    const { client, repo } = await makeRepo();
    const settings = { theme: "dark", language: "en" } as unknown as GeneralSettings;

    await repo.save(settings);
    const loaded = await repo.load();

    expect(loaded).toEqual(settings);
    const rows = await client.db.settings.orderBy("key").toArray();
    expect(rows.map(({ key, _dirty }) => ({ key, _dirty }))).toEqual([
      { key: "language", _dirty: 1 },
      { key: "theme", _dirty: 1 },
    ]);
  });

  it("save is idempotent (upsert, not insert-only)", async () => {
    const { repo } = await makeRepo();
    await repo.save({ theme: "dark" } as unknown as GeneralSettings);
    await repo.save({ theme: "light" } as unknown as GeneralSettings);

    const loaded = await repo.load();
    expect(loaded).toEqual({ theme: "light" });
  });

  it("drops keys no longer present in the saved object", async () => {
    const { repo } = await makeRepo();
    await repo.save({ theme: "dark", language: "en" } as unknown as GeneralSettings);
    await repo.save({ theme: "dark" } as unknown as GeneralSettings);

    expect(await repo.load()).toEqual({ theme: "dark" });
  });

  it("round-trips nested objects and non-string values", async () => {
    const { repo } = await makeRepo();
    const settings = {
      notifications: true,
      reminderMinutesBefore: 15,
      location: { source: "auto", resolvedAt: 1, lat: 1.1, lng: 2.2, name: "Jakarta" },
    } as unknown as GeneralSettings;

    await repo.save(settings);

    expect(await repo.load()).toEqual(settings);
  });

  it("notifies the write notifier exactly once per save() call, regardless of key count", async () => {
    const { repo, writeNotifier } = await makeRepo();
    const notified: string[] = [];
    writeNotifier.subscribe((table) => notified.push(table));

    await repo.save({ theme: "dark", language: "en", notifications: true } as unknown as GeneralSettings);
    expect(notified).toEqual(["settings"]);

    notified.length = 0;
    await repo.load();
    expect(notified).toEqual([]);
  });
});
