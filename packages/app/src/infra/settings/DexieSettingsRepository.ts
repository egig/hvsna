import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { GeneralSettings } from "@/modules/settings/settings";
import type { DbExecutor } from "@/modules/db/executor";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

/**
 * One row per top-level `GeneralSettings` key, rather than a single JSON
 * blob row — lets the sync engine push/pull individual setting changes
 * without clobbering fields another device touched concurrently.
 */
export class DexieSettingsRepository implements ISettingsRepository {
  constructor(
    private readonly executor: DbExecutor,
    private readonly writeNotifier: WriteNotifier
  ) {}

  async load(): Promise<GeneralSettings | null> {
    const rows = await this.executor.db.settings.toArray();
    if (rows.length === 0) return null;

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = JSON.parse(row.value);
    }
    return result as unknown as GeneralSettings;
  }

  async save(settings: GeneralSettings): Promise<void> {
    return this.executor.transaction((executor) =>
      new DexieSettingsRepository(executor, this.writeNotifier).saveInTransaction(settings)
    );
  }

  private async saveInTransaction(settings: GeneralSettings): Promise<void> {
    const { db } = this.executor;
    const now = Date.now();
    const entries = Object.entries(settings).filter(([, value]) => value !== undefined);
    const keys = new Set(entries.map(([key]) => key));

    // Replace-the-whole-object semantics: drop any key not present anymore.
    await db.settings.filter((row) => !keys.has(row.key)).delete();
    await db.settings.bulkPut(
      entries.map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_at: now,
        _dirty: 1 as const,
      }))
    );
    this.executor.afterCommit(() => this.writeNotifier.notify("settings"));
  }
}
