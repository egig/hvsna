import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import type { Task, TaskRepeat, TaskUpdateInput } from "./types";
import type { RecurringTask, RecurringTaskCreateInput } from "./recurring-task";
import { generateOccurrencesForTemplate } from "./recurring-task-generator";

export interface DemoteAndDeleteFutureDeps {
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteRecurringTask: (id: string) => Promise<void>;
  taskRepository: ITaskRepository;
}

export interface PromoteToRecurringDeps {
  createRecurringTask: (
    input: RecurringTaskCreateInput,
  ) => Promise<RecurringTask>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  taskRepository: ITaskRepository;
  todayEpoch: number;
}

/**
 * Converts a regular task into a recurring task series.
 *
 * Steps:
 * 1. Create a RecurringTask template in PouchDB (rtask_ doc).
 * 2. Link this task to the template first — so the occurrence generator
 *    finds it via findByRecurringTaskId and skips this date (no duplicate).
 * 3. Generate future instances up to the horizon.
 */
export async function promoteTaskToRecurring(
  taskId: string,
  taskInput: TaskUpdateInput,
  repeat: TaskRepeat,
  repeatInterval: number,
  templateInput: RecurringTaskCreateInput,
  deps: PromoteToRecurringDeps,
): Promise<Task> {
  const { createRecurringTask, updateTask, taskRepository, todayEpoch } = deps;

  const template = await createRecurringTask(templateInput);

  const linkedInput: TaskUpdateInput = {
    ...taskInput,
    repeat,
    repeatInterval,
    recurringTaskId: template.id,
  };
  const result = await updateTask(taskId, linkedInput);

  await generateOccurrencesForTemplate(template, taskRepository, todayEpoch);

  return result;
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
  deps: DemoteAndDeleteFutureDeps,
): Promise<Task> {
  const { updateTask, deleteRecurringTask, taskRepository } = deps;

  const all = await taskRepository.findByRecurringTaskId(task.recurringTaskId!);
  const futurePending = all.filter(
    (t) =>
      t.id !== taskId &&
      t.status !== 1 &&
      t.atDateHijri != null &&
      t.atDateHijri >= task.atDateHijri!,
  );
  await Promise.all(futurePending.map((t) => taskRepository.delete(t.id!)));
  await deleteRecurringTask(task.recurringTaskId!);

  return updateTask(taskId, {
    ...taskInput,
    recurringTaskId: null,
    repeat: "none",
    repeatInterval: undefined,
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
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>,
): Promise<Task> {
  return updateTask(taskId, {
    ...taskInput,
    recurringTaskId: null,
    repeat: "none",
    repeatInterval: undefined,
  });
}
