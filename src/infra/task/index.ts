export {
  PouchDBTaskRepository,
  PouchDBProjectRepository,
} from "./PouchDBTaskRepository";

export {
  createTaskRepository,
  createRepositories,
  createDatabase,
} from "./TaskRepositoryFactory";

export type { ITaskAndProjectRepository } from "./TaskRepositoryFactory";
