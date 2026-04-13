import PouchDB from "pouchdb";
import { TaskUseCases } from "./TaskUseCases";
import { createNotificationsProvider } from "../../infra";
import {
  PouchDBTaskRepository,
  PouchDBListRepository,
} from "../../infra/task/PouchDBTaskRepository";
import type {
  ITaskRepository,
  IListRepository,
} from "../../domain/task/ITaskRepository";

export function createTaskUseCases(db: PouchDB.Database): TaskUseCases {
  const notificationsProvider = createNotificationsProvider();
  const taskRepository: ITaskRepository = new PouchDBTaskRepository(db);
  const listRepository: IListRepository = new PouchDBListRepository(db);

  return new TaskUseCases(
    notificationsProvider,
    taskRepository,
    listRepository
  );
}
