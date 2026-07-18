import type { IReminderRegistryRepository } from "../../domain/task/IReminderRegistryRepository";
import logger from "../../modules/logger";

const REGISTRY_DOC_ID = "reminder_registry_virtual";

interface ReminderRegistryDoc {
  _id: string;
  _rev?: string;
  type: "reminder_registry";
  scheduledIds: string[];
}

export class PouchDBReminderRegistryRepository
  implements IReminderRegistryRepository
{
  constructor(private readonly db: PouchDB.Database) {}

  private async loadDoc(): Promise<ReminderRegistryDoc> {
    try {
      return (await this.db.get(REGISTRY_DOC_ID)) as ReminderRegistryDoc;
    } catch {
      return {
        _id: REGISTRY_DOC_ID,
        type: "reminder_registry",
        scheduledIds: [],
      };
    }
  }

  async load(): Promise<string[]> {
    const doc = await this.loadDoc();
    return doc.scheduledIds;
  }

  async save(scheduledIds: string[]): Promise<void> {
    const doc = await this.loadDoc();
    try {
      await this.db.put({ ...doc, scheduledIds });
    } catch (err) {
      logger.error("Failed to save reminder registry:", err);
    }
  }
}
