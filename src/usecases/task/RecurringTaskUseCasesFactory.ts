import PouchDB from "pouchdb";
import { RecurringTaskUseCases } from "./RecurringTaskUseCases";
import { PouchDBRecurringTaskRepository } from "../../infra/task/PouchDBRecurringTaskRepository";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";

export function createRecurringTaskUseCases(
  db: PouchDB.Database
): RecurringTaskUseCases {
  const recurringTaskRepository: IRecurringTaskRepository =
    new PouchDBRecurringTaskRepository(db);

  return new RecurringTaskUseCases(recurringTaskRepository);
}
