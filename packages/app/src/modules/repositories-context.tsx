import React, { createContext, useContext, type ReactNode } from "react";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import { SqliteTaskRepository } from "../infra/task/SqliteTaskRepository";
import { SqliteRecurringTaskRepository } from "../infra/task/SqliteRecurringTaskRepository";
import { LocalReminderRegistryRepository } from "../infra/task/LocalReminderRegistryRepository";
import { SqliteSettingsRepository } from "../infra/settings/SqliteSettingsRepository";
import { SqliteTagRepository } from "../infra/tag/SqliteTagRepository";
import type { SqliteClient } from "./sqlite/client";
import { createWriteNotifier, type WriteNotifier } from "./sync/write-notifier";

export interface Repositories {
  taskRepository: ITaskRepository;
  recurringTaskRepository: IRecurringTaskRepository;
  settingsRepository: ISettingsRepository;
  reminderRegistryRepository: IReminderRegistryRepository;
  tagRepository: ITagRepository;
  /** Not a repository — cross-cutting "a local write just happened" signal,
   * shared into each repository above and read by SyncProvider (via
   * useRepositories()) to debounce a write-triggered sync. See
   * modules/sync/write-notifier.ts. */
  writeNotifier: WriteNotifier;
}

export function createWebRepositories(sqliteClient: SqliteClient): Repositories {
  const writeNotifier = createWriteNotifier();
  const tagRepository = new SqliteTagRepository(sqliteClient, writeNotifier);
  return {
    taskRepository: new SqliteTaskRepository(sqliteClient, tagRepository, writeNotifier),
    recurringTaskRepository: new SqliteRecurringTaskRepository(sqliteClient, tagRepository, writeNotifier),
    settingsRepository: new SqliteSettingsRepository(sqliteClient, writeNotifier),
    reminderRegistryRepository: new LocalReminderRegistryRepository(),
    tagRepository,
    writeNotifier,
  };
}

const RepositoriesContext = createContext<Repositories | undefined>(undefined);

export const RepositoriesProvider: React.FC<{
  children: ReactNode;
  repositories: Repositories;
}> = ({ repositories, children }) => (
  <RepositoriesContext.Provider value={repositories}>
    {children}
  </RepositoriesContext.Provider>
);

export const useRepositories = (): Repositories => {
  const context = useContext(RepositoriesContext);
  if (!context) {
    throw new Error(
      "useRepositories must be used within a RepositoriesProvider"
    );
  }
  return context;
};
