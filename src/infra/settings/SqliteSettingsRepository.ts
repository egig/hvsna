import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { GeneralSettings } from "@/modules/settings/settings";
import type { SqliteExecutor } from "@/modules/sqlite/client";

export class SqliteSettingsRepository implements ISettingsRepository {
  constructor(private readonly client: SqliteExecutor) {}

  async load(): Promise<GeneralSettings | null> {
    const rows = await this.client.run(`SELECT payload FROM settings WHERE id = 'settings'`);
    if (!rows[0]) return null;
    return JSON.parse(String(rows[0].payload));
  }

  async save(settings: GeneralSettings): Promise<void> {
    await this.client.run(
      `INSERT INTO settings (id, payload, updated_at, _dirty) VALUES ('settings', ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, _dirty = 1`,
      [JSON.stringify(settings), Date.now()]
    );
  }
}
