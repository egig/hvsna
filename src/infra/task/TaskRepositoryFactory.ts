import { PouchDBTaskRepository } from "./PouchDBTaskRepository";
import { PouchDBProjectRepository } from "./PouchDBTaskRepository";
import type {
  ITaskRepository,
  IProjectRepository,
} from "../../domain/task/ITaskRepository";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
} from "../../modules/task/types";
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectQuery,
} from "../../modules/task/types";

/**
 * Combined interface that includes both task and list operations with renamed methods to avoid conflicts
 */
export interface ITaskAndProjectRepository {
  // Task operations
  createTask(input: TaskCreateInput): Promise<Task>;
  updateTask(id: string, input: TaskUpdateInput): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  findTaskById(id: string): Promise<Task | null>;
  findTasks(query?: TaskQuery): Promise<Task[]>;
  findTasksByDate(date: string): Promise<Task[]>;
  findTasksByHijriDate(hijriDate: string): Promise<Task[]>;
  findTasksWithPagination(offset: number, limit?: number): Promise<Task[]>;
  findTasksBefore(beforeHijri: any): Promise<Task[]>;
  findTodayCompletedTasks(todayHijri: any): Promise<Task[]>;
  findTasksAfter(todayHijri: any): Promise<Task[]>;
  findBrowsedTasks(
    query?: any,
    offset?: number,
    limit?: number
  ): Promise<Task[]>;
  findInboxTasks(): Promise<Task[]>;
  findTasksByProjectId(
    projectId: string,
    offset?: number,
    limit?: number
  ): Promise<Task[]>;
  completeTask(id: string): Promise<Task>;
  reopenTask(id: string): Promise<Task>;

  // Project operations
  createProject(input: ProjectCreateInput): Promise<Project>;
  updateProject(id: string, input: ProjectUpdateInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  findProjectById(id: string): Promise<Project | null>;
  findProjects(query?: ProjectQuery): Promise<Project[]>;
  findProjectsWithPagination(offset: number, limit?: number): Promise<Project[]>;
}

/**
 * Factory function to create a task repository with automatic platform detection
 * The repository will automatically use SQLite on native platforms and IndexedDB on web
 */
export function createTaskRepository(dbName?: string): ITaskAndProjectRepository {
  // Create a single database instance that both repositories will share
  const db = PouchDBTaskRepository.createDatabase(dbName);

  // Create repositories with the shared database
  const taskRepo = new PouchDBTaskRepository(db);
  const projectRepo = new PouchDBProjectRepository(db);

  // Combine both repositories into a single object with renamed methods
  return {
    // Task operations (renamed to avoid conflicts)
    createTask: taskRepo.create.bind(taskRepo),
    updateTask: taskRepo.update.bind(taskRepo),
    deleteTask: taskRepo.delete.bind(taskRepo),
    findTaskById: taskRepo.findById.bind(taskRepo),
    findTasks: taskRepo.find.bind(taskRepo),
    findTasksByDate: taskRepo.findByDate.bind(taskRepo),
    findTasksByHijriDate: taskRepo.findByHijriDate.bind(taskRepo),
    findTasksWithPagination: taskRepo.findWithPagination.bind(taskRepo),
    findTasksBefore: taskRepo.findTasksBefore.bind(taskRepo),
    findTodayCompletedTasks: taskRepo.findTodayCompletedTasks.bind(taskRepo),
    findTasksAfter: taskRepo.findTasksAfter.bind(taskRepo),
    findBrowsedTasks: taskRepo.findBrowsedTasks.bind(taskRepo),
    findInboxTasks: taskRepo.findInboxTasks.bind(taskRepo),
    findTasksByProjectId: taskRepo.findTasksByProjectId.bind(taskRepo),
    completeTask: taskRepo.completeTask.bind(taskRepo),
    reopenTask: taskRepo.reopenTask.bind(taskRepo),

    // Project operations
    createProject: projectRepo.create.bind(projectRepo),
    updateProject: projectRepo.update.bind(projectRepo),
    deleteProject: projectRepo.delete.bind(projectRepo),
    findProjectById: projectRepo.findById.bind(projectRepo),
    findProjects: projectRepo.find.bind(projectRepo),
    findProjectsWithPagination: projectRepo.findWithPagination.bind(projectRepo),
  };
}

/**
 * Factory function to create separate repositories if needed
 */
export function createRepositories(dbName?: string) {
  // Create a single database instance that both repositories will share
  const db = PouchDBTaskRepository.createDatabase(dbName);

  const taskRepo = new PouchDBTaskRepository(db);
  const projectRepo = new PouchDBProjectRepository(db);

  return {
    taskRepository: taskRepo,
    projectRepository: projectRepo,
  };
}

/**
 * Helper function to create a database instance with the appropriate adapter
 */
export function createDatabase(dbName?: string) {
  return PouchDBTaskRepository.createDatabase(dbName);
}
