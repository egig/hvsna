import type { ISettingsRepository } from "../../domain/settings/ISettingsRepository";
import type { GeneralSettings } from "../../modules/settings/settings";

const SETTINGS_DOC_ID = "general_settings";

export class PouchDBSettingsRepository implements ISettingsRepository {
  constructor(private readonly db: PouchDB.Database) {}

  async load(): Promise<GeneralSettings | null> {
    try {
      const doc = (await this.db.get(SETTINGS_DOC_ID)) as any;
      return doc.settings ?? null;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async save(settings: GeneralSettings): Promise<void> {
    const now = new Date().toISOString();
    try {
      const existing = (await this.db.get(SETTINGS_DOC_ID)) as any;
      await this.db.put({ ...existing, settings, updated_at: now });
    } catch (err: any) {
      if (err.status === 404) {
        await this.db.put({ _id: SETTINGS_DOC_ID, settings, created_at: now, updated_at: now });
      } else {
        throw err;
      }
    }
  }
}
