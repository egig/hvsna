import type { Tag, TagUpdateInput, TagWithCount } from "./index";

export interface ITagRepository {
  findAll(): Promise<TagWithCount[]>;
  findByName(name: string): Promise<Tag | null>;
  update(id: string, input: TagUpdateInput): Promise<Tag>;
  delete(id: string): Promise<void>;

  /** Replaces the full tag set on a task, creating any not-yet-seen tag names. */
  setTaskTags(taskId: string, tagNames: string[]): Promise<void>;
  /** Replaces the full tag set on a recurring task template, creating any not-yet-seen tag names. */
  setRecurringTaskTags(recurringTaskId: string, tagNames: string[]): Promise<void>;

  /** Batch-loads tag names per task id, for attaching onto Task read results. */
  getTagsForTasks(taskIds: string[]): Promise<Map<string, string[]>>;
  /** Batch-loads tag names per recurring task id, for attaching onto RecurringTask read results. */
  getTagsForRecurringTasks(recurringTaskIds: string[]): Promise<Map<string, string[]>>;
}
