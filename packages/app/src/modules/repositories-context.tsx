import React, { createContext, useContext, type ReactNode } from "react";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import { SqliteTaskRepository } from "../infra/task/SqliteTaskRepository";
import { SqliteRecurringTaskRepository } from "../infra/task/SqliteRecurringTaskRepository";
import { LocalReminderRegistryRepository } from "../infra/task/LocalReminderRegistryRepository";
import { SqliteSettingsRepository } from "../infra/settings/SqliteSettingsRepository";
import type { SqliteClient } from "./sqlite/client";

export interface Repositories {
  taskRepository: ITaskRepository;
  recurringTaskRepository: IRecurringTaskRepository;
  settingsRepository: ISettingsRepository;
  reminderRegistryRepository: IReminderRegistryRepository;
}

export function createWebRepositories(sqliteClient: SqliteClient): Repositories {
  return {
    taskRepository: new SqliteTaskRepository(sqliteClient),
    recurringTaskRepository: new SqliteRecurringTaskRepository(sqliteClient),
    settingsRepository: new SqliteSettingsRepository(sqliteClient),
    reminderRegistryRepository: new LocalReminderRegistryRepository(),
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
