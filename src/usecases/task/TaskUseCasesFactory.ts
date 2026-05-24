import { TaskUseCases } from "./TaskUseCases";
import { createNotificationsDriver } from "../../infra";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";

export function createTaskUseCases(db: PouchDB.Database): TaskUseCases {
  const notificationsProvider = createNotificationsDriver();
  const taskRepository: ITaskRepository = new PouchDBTaskRepository(db);

  return new TaskUseCases(notificationsProvider, taskRepository);
}
