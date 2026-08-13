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

export interface Repositories {
  taskRepository: ITaskRepository;
  recurringTaskRepository: IRecurringTaskRepository;
  settingsRepository: ISettingsRepository;
  reminderRegistryRepository: IReminderRegistryRepository;
  tagRepository: ITagRepository;
}

export function createWebRepositories(sqliteClient: SqliteClient): Repositories {
  const tagRepository = new SqliteTagRepository(sqliteClient);
  return {
    taskRepository: new SqliteTaskRepository(sqliteClient, tagRepository),
    recurringTaskRepository: new SqliteRecurringTaskRepository(sqliteClient, tagRepository),
    settingsRepository: new SqliteSettingsRepository(sqliteClient),
    reminderRegistryRepository: new LocalReminderRegistryRepository(),
    tagRepository,
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
