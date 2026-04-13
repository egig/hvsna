import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import type { Task, TaskRepeat, TaskUpdateInput } from "./types";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
} from "./recurring-task";
import { generateOccurrencesForTemplate } from "./recurring-task-generator";

export interface UpdateRecurringSeriesDeps {
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  updateRecurringTask: (
    id: string,
    input: RecurringTaskUpdateInput
  ) => Promise<RecurringTask>;
  taskRepository: ITaskRepository;
  todayEpoch: number;
}

export interface DemoteAndDeleteFutureDeps {
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteRecurringTask: (id: string) => Promise<void>;
  taskRepository: ITaskRepository;
}

export interface PromoteToRecurringDeps {
  createRecurringTask: (
    input: RecurringTaskCreateInput
  ) => Promise<RecurringTask>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  taskRepository: ITaskRepository;
  todayEpoch: number;
}

/**
 * Updates a recurring task series from a specific instance forward:
 * 1. Updates this task instance with new values.
 * 2. Deletes all future pending instances (from this task's date onward).
 * 3. Updates the RecurringTask template, resetting baseDateHijri to this
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
  const { updateTask, updateRecurringTask, taskRepository, todayEpoch } = deps;

  // Delete all future pending instances except this one
  const all = await taskRepository.findByRecurringTaskId(task.recurringTaskId!);
  const futurePending = all.filter(
    (t) =>
      t.id !== taskId &&
      t.status !== 1 &&
      t.atDateHijri != null &&
      t.atDateHijri >= task.atDateHijri!
  );
  await Promise.all(futurePending.map((t) => taskRepository.delete(t.id!)));

  // Update the template; anchor baseDateHijri to this task's date so the
  // generator produces instances starting from here with the new pattern
  const updatedTemplate = await updateRecurringTask(task.recurringTaskId!, {
    ...templateInput,
    baseDateHijri: task.atDateHijri,
  });

  // Update this task instance
  const result = await updateTask(taskId, taskInput);

  // Regenerate future instances with the new pattern
  await generateOccurrencesForTemplate(
    updatedTemplate,
    taskRepository,
    todayEpoch
  );

  return result;
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
  deps: PromoteToRecurringDeps
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
  deps: DemoteAndDeleteFutureDeps
): Promise<Task> {
  const { updateTask, deleteRecurringTask, taskRepository } = deps;

  const all = await taskRepository.findByRecurringTaskId(task.recurringTaskId!);
  const futurePending = all.filter(
    (t) =>
      t.id !== taskId &&
      t.status !== 1 &&
      t.atDateHijri != null &&
      t.atDateHijri >= task.atDateHijri!
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
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>
): Promise<Task> {
  return updateTask(taskId, {
    ...taskInput,
    recurringTaskId: null,
    repeat: "none",
    repeatInterval: undefined,
  });
}
