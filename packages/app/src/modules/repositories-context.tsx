import React, { createContext, useContext, type ReactNode } from "react";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import { DexieTaskRepository } from "../infra/task/DexieTaskRepository";
import { DexieRecurringTaskRepository } from "../infra/task/DexieRecurringTaskRepository";
import { LocalReminderRegistryRepository } from "../infra/task/LocalReminderRegistryRepository";
import { DexieSettingsRepository } from "../infra/settings/DexieSettingsRepository";
import { DexieTagRepository } from "../infra/tag/DexieTagRepository";
import type { DbExecutor } from "./db/executor";
import { createWriteNotifier, type WriteNotifier } from "./sync/write-notifier";

export type TaskRepositories = Pick<Repositories, "taskRepository" | "recurringTaskRepository">;

export interface Repositories {
  transaction<T>(operation: (repositories: TaskRepositories) => Promise<T>): Promise<T>;
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

export function createWebRepositories(
  database: DbExecutor,
  writeNotifier = createWriteNotifier(),
): Repositories {
  const tagRepository = new DexieTagRepository(database, writeNotifier);
  return {
    transaction: (operation) => database.transaction((executor) =>
      operation(createWebRepositories(executor, writeNotifier))),
    taskRepository: new DexieTaskRepository(database, writeNotifier),
    recurringTaskRepository: new DexieRecurringTaskRepository(database, writeNotifier),
    settingsRepository: new DexieSettingsRepository(database, writeNotifier),
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
