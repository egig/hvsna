import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import logger from "@/modules/logger";

const STORAGE_KEY = "hvsna_reminder_registry";

/**
 * Per-device OS-notification-scheduling bookkeeping — deliberately never
 * synced (see the plan): reconciling "which reminders did this device
 * already schedule" across devices doesn't mean anything. Plain
 * localStorage is enough; no need to round-trip through the database
 * for this.
 */
export class LocalReminderRegistryRepository implements IReminderRegistryRepository {
  async load(): Promise<string[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      logger.error("Failed to load reminder registry:", err);
      return [];
    }
  }

  async save(scheduledIds: string[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduledIds));
    } catch (err) {
      logger.error("Failed to save reminder registry:", err);
    }
  }
}
