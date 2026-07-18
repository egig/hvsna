export interface IReminderRegistryRepository {
  load(): Promise<string[]>;
  save(scheduledIds: string[]): Promise<void>;
}
