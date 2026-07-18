import React, { createContext, useContext, type ReactNode } from "react";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ISettingsRepository } from "@/domain/settings/ISettingsRepository";
import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";
import { PouchDBTaskRepository } from "../infra/task/PouchDBTaskRepository";
import { PouchDBRecurringTaskRepository } from "../infra/task/PouchDBRecurringTaskRepository";
import { PouchDBReminderRegistryRepository } from "../infra/task/PouchDBReminderRegistryRepository";
import { PouchDBSettingsRepository } from "../infra/settings/PouchDBSettingsRepository";

export interface Repositories {
  taskRepository: ITaskRepository;
  recurringTaskRepository: IRecurringTaskRepository;
  settingsRepository: ISettingsRepository;
  reminderRegistryRepository: IReminderRegistryRepository;
}

export function createWebRepositories(pouchDb: PouchDB.Database): Repositories {
  return {
    taskRepository: new PouchDBTaskRepository(pouchDb),
    recurringTaskRepository: new PouchDBRecurringTaskRepository(pouchDb),
    settingsRepository: new PouchDBSettingsRepository(pouchDb),
    reminderRegistryRepository: new PouchDBReminderRegistryRepository(pouchDb),
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
