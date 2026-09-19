import dayjs from "dayjs";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { Task, TaskRecurringType, TaskUpdateInput } from "@/domain/task";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
} from "./recurring-task";
/** Multi-write helpers must receive repositories/callbacks from the same
 * Repositories.transaction scope. UI effects run only after it commits. */
export interface UpdateRecurringSeriesDeps {
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  updateRecurringTask: (
    id: string | number,
    input: RecurringTaskUpdateInput
  ) => Promise<RecurringTask>;
  taskRepository: ITaskRepository;
  recurringTaskRepository: IRecurringTaskRepository;
}

export interface DemoteAndDeleteFutureDeps {
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteRecurringTask: (id: string | number) => Promise<void>;
  taskRepository: ITaskRepository;
}

export interface PromoteToRecurringDeps {
  createRecurringTask: (
    input: RecurringTaskCreateInput
  ) => Promise<RecurringTask>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  taskRepository: ITaskRepository;
}

/**
 * Updates a recurring task series from a specific instance forward:
 * 1. Updates this task instance with new values.
 * 2. Deletes all future pending instances (from this task's date onward).
 * 3. Updates the RecurringTask template, resetting baseDateEpoch to this
 *    task's date so the generator starts fresh with the new pattern.
 * 4. Regenerates future instances from the updated template.
 *
 * Past completed instances are left untouched.
 */
export async function updateRecurringSeries(
  taskId: string,
  taskInput: TaskUpdateInput,
  task: Task,
  templateInput: RecurringTaskUpdateInput,
  deps: UpdateRecurringSeriesDeps
): Promise<Task> {
  const { updateTask, updateRecurringTask, taskRepository, recurringTaskRepository } =
    deps;

  // Delete all future pending instances except this one (virtuals need no cleanup,
  // but materialized real tasks must be removed so they don't appear as stale exceptions)
  const all = await taskRepository.findByRecurringTaskId(task.recurringTaskId!);
  const futurePending = all.filter(
    (t) =>
      t.id !== taskId &&
      t.status !== 1 &&
      (t.atEpochMillis ?? 0) >= (task.atEpochMillis ?? 0)
  );
  for (const task of futurePending) await taskRepository.delete(task.id!);

  // The instance being edited stays as a real (materialized) task at its own
  // date, so the generator must not also emit a virtual occurrence for that
  // day — keep an occurrence exception for it. Drop exceptions for the future
  // instances we just deleted (>= the anchor day); keep past ones so the
  // 60-day overdue lookback doesn't resurface already-completed occurrences.
  const existing = await recurringTaskRepository.findById(task.recurringTaskId!);
  const anchorDay =
    task.atEpochMillis != null
      ? dayjs(task.atEpochMillis).format("YYYYMMDD")
      : null;
  const nextExceptions = anchorDay
    ? [
        ...new Set([
          ...(existing?.occurrenceExceptions ?? []).filter((d) => d < anchorDay),
          anchorDay,
        ]),
      ]
    : [];

  // Anchor baseDateEpoch to this task's date so future virtuals start fresh
  await updateRecurringTask(task.recurringTaskId!, {
    ...templateInput,
    baseDateEpoch: task.atEpochMillis ?? undefined,
    occurrenceExceptions: nextExceptions,
  });

  return updateTask(taskId, taskInput);
}

/**
 * Converts a regular task into a recurring task series.
 *
 * Steps:
 * 1. Create a RecurringTask template (rtask_ row), excluding this task's own
 *    day via occurrenceExceptions — this instance stays a real materialized
 *    task, so the generator must not also emit a virtual for that day
 *    (mirrors the exception bookkeeping in updateRecurringSeries above).
 * 2. Link this task to the template.
 */
export async function promoteTaskToRecurring(
  taskId: string,
  taskInput: TaskUpdateInput,
  recurringType: TaskRecurringType,
  recurringInterval: number,
  templateInput: RecurringTaskCreateInput,
  deps: PromoteToRecurringDeps
): Promise<Task> {
  const { createRecurringTask, updateTask } = deps;

  const anchorDay =
    taskInput.atEpochMillis != null
      ? dayjs(taskInput.atEpochMillis).format("YYYYMMDD")
      : null;

  const template = await createRecurringTask({
    ...templateInput,
    occurrenceExceptions: anchorDay ? [anchorDay] : [],
  });

  return updateTask(taskId, {
    ...taskInput,
    recurringType: recurringType,
    recurringInterval: recurringInterval,
    recurringTaskId: template.id,
  });
}

/**
 * Detaches a single task instance from its recurring series AND deletes all
 * future pending instances of the series (from this task's date onward).
 * The rtask_ template is also deleted so no new instances are generated.
 * Completed past instances are left untouched.
 */
export async function demoteTaskFromRecurringAndDeleteFuture(
  taskId: string,
  taskInput: TaskUpdateInput,
  task: Task,
  deps: DemoteAndDeleteFutureDeps
): Promise<Task> {
  const { updateTask, deleteRecurringTask, taskRepository } = deps;

  const all = await taskRepository.findByRecurringTaskId(task.recurringTaskId!);
  const futurePending = all.filter(
    (t) =>
      t.id !== taskId &&
      t.status !== 1 &&
      (t.atEpochMillis ?? 0) >= (task.atEpochMillis ?? 0)
  );
  for (const task of futurePending) await taskRepository.delete(task.id!);
  await deleteRecurringTask(task.recurringTaskId!);

  return updateTask(taskId, {
    ...taskInput,
    recurringTaskId: null,
    recurringType: "none",
    recurringInterval: undefined,
  });
}

/**
 * Detaches a single task instance from its recurring series, making it a
 * standalone one-time task. The template and all other instances are left
 * untouched — the series continues running.
 */
export async function demoteTaskFromRecurring(
  taskId: string,
  taskInput: TaskUpdateInput,
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>
): Promise<Task> {
  return updateTask(taskId, {
    ...taskInput,
    recurringTaskId: null,
    recurringType: "none",
    recurringInterval: undefined,
  });
}
