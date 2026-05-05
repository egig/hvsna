import PouchDB from "pouchdb";
import { TaskUseCases } from "./TaskUseCases";
import { createNotificationsProvider } from "../../infra";
import {
  PouchDBTaskRepository,
  PouchDBProjectRepository,
} from "../../infra/task/PouchDBTaskRepository";
import type {
  ITaskRepository,
  IProjectRepository,
} from "../../domain/task/ITaskRepository";

export function createTaskUseCases(db: PouchDB.Database): TaskUseCases {
  const notificationsProvider = createNotificationsProvider();
  const taskRepository: ITaskRepository = new PouchDBTaskRepository(db);
  const projectRepository: IProjectRepository = new PouchDBProjectRepository(
    db
  );

  return new TaskUseCases(
    notificationsProvider,
    taskRepository,
    projectRepository
  );
}
