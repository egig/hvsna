import PouchDB from "pouchdb";
import { RecurringTaskUseCases } from "./RecurringTaskUseCases";
import { PouchDBRecurringTaskRepository } from "../../infra/task/PouchDBRecurringTaskRepository";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";

export function createRecurringTaskUseCases(
  db: PouchDB.Database
): RecurringTaskUseCases {
  const recurringTaskRepository: IRecurringTaskRepository =
    new PouchDBRecurringTaskRepository(db);
  const taskRepository: ITaskRepository = new PouchDBTaskRepository(db);

  return new RecurringTaskUseCases(recurringTaskRepository, taskRepository);
}
