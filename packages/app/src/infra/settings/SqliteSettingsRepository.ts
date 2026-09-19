import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { GeneralSettings } from "@/modules/settings/settings";
import type { SqliteExecutor } from "@/modules/sqlite/client";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

/**
 * One row per top-level `GeneralSettings` key, rather than a single JSON
 * blob row — lets a future sync engine push/pull individual setting changes
 * without clobbering fields another device touched concurrently.
 */
export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(
    private readonly client: SqliteExecutor,
    private readonly writeNotifier: WriteNotifier
  ) {}

  async load(): Promise<GeneralSettings | null> {
    const rows = await this.client.run(`SELECT key, value FROM settings`);
    if (rows.length === 0) return null;

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[String(row.key)] = JSON.parse(String(row.value));
    }
    return result as unknown as GeneralSettings;
  }

  async save(settings: GeneralSettings): Promise<void> {
    return this.client.transaction((client) =>
      new SqliteSettingsRepository(client, this.writeNotifier).saveInTransaction(settings)
    );
  }

  private async saveInTransaction(settings: GeneralSettings): Promise<void> {
    const now = Date.now();
    const entries = Object.entries(settings).filter(([, value]) => value !== undefined);
    const keys = entries.map(([key]) => key);

    // Replace-the-whole-object semantics: drop any key not present anymore.
    if (keys.length > 0) {
      await this.client.run(
        `DELETE FROM settings WHERE key NOT IN (${keys.map(() => "?").join(",")})`,
        keys
      );
    } else {
      await this.client.run(`DELETE FROM settings`);
    }

    for (const [key, value] of entries) {
      await this.client.run(
        `INSERT INTO settings (key, value, updated_at, _dirty) VALUES (?, ?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, _dirty = 1`,
        [key, JSON.stringify(value), now]
      );
    }
    this.client.afterCommit(() => this.writeNotifier.notify("settings"));
  }
}
