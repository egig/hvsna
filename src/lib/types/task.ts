// Task types have been moved to src/modules/task/types.ts
// Re-export them from there for backward compatibility
export type {
  TaskStatus,
  TaskRepeat,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskChange,
  TaskQuery,
} from "../../modules/task/types";
