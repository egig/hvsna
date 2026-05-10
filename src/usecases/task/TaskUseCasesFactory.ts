import PouchDB from "pouchdb";
import { TaskUseCases } from "./TaskUseCases";
import { createNotificationsProvider } from "../../infra";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";

export function createTaskUseCases(db: PouchDB.Database): TaskUseCases {
  const notificationsProvider = createNotificationsProvider();
  const taskRepository: ITaskRepository = new PouchDBTaskRepository(db);

  return new TaskUseCases(notificationsProvider, taskRepository);
}
