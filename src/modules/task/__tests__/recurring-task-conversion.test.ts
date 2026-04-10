import { describe, it, expect, vi } from "vitest";
import {
  promoteTaskToRecurring,
  demoteTaskFromRecurring,
  demoteTaskFromRecurringAndDeleteFuture,
} from "../recurring-task-conversion";
import { Task } from "../types";
import type { TaskUpdateInput } from "../types";
import type { RecurringTask } from "../recurring-task";
import type { ITaskRepository } from "../../../domain/task/ITaskRepository";

// ---------------------------------------------------------------------------
// Shared test doubles
// ---------------------------------------------------------------------------

function makeUpdateTask(overrides?: Partial<Task>) {
  return vi.fn(async (_id: string, input: TaskUpdateInput) =>
    new Task({ id: _id, name: "Test", ...overrides, ...(input as Partial<Task>) }),
  );
}

function makeCreateRecurringTask(templateId = "rtask_test") {
  return vi.fn(async (input: any): Promise<RecurringTask> => ({
    id: templateId,
    user_id: "user1",
    name: input.name,
    repeat: input.repeat,
    repeatInterval: input.repeatInterval ?? 1,
    baseDateHijri: input.baseDateHijri,
  }));
}

function makeRepo(existingByRecurringId: Task[] = []): ITaskRepository {
  const created: Task[] = [];
  return {
    findByRecurringTaskId: vi.fn(async () => existingByRecurringId),
    create: vi.fn(async (input) => {
      const t = new Task({ id: `task_${Date.now()}`, ...input });
      created.push(t);
      return t;
    }),
    // unused stubs
    update: vi.fn(), delete: vi.fn(), findById: vi.fn(), find: vi.fn(),
    findByDate: vi.fn(), findByHijriDate: vi.fn(), findWithPagination: vi.fn(),
    findTasksBefore: vi.fn(), findTodayCompletedTasks: vi.fn(),
    findTasksAfter: vi.fn(), findBrowsedTasks: vi.fn(), findInboxTasks: vi.fn(),
    findTasksByListId: vi.fn(), deletePendingByRecurringTaskId: vi.fn(),
    completeTask: vi.fn(), reopenTask: vi.fn(),
    _created: created,
  } as unknown as ITaskRepository & { _created: Task[] };
}

const BASE_TASK_INPUT: TaskUpdateInput = {
  name: "Daily standup",
  atDateHijri: "14460701",
  timezone: "Asia/Jakarta",
};

const TODAY_EPOCH = new Date("2025-01-01T00:00:00Z").getTime();

// ---------------------------------------------------------------------------
// promoteTaskToRecurring
// ---------------------------------------------------------------------------

describe("promoteTaskToRecurring", () => {
  it("creates a RecurringTask template with the supplied fields", async () => {
    const createRecurringTask = makeCreateRecurringTask("rtask_abc");
    const updateTask = makeUpdateTask();
    const repo = makeRepo();

    await promoteTaskToRecurring(
      "task_1",
      BASE_TASK_INPUT,
      "weekly",
      1,
      {
        name: "Daily standup",
        baseDateHijri: "14460701",
        repeat: "weekly",
        repeatInterval: 1,
        timezone: "Asia/Jakarta",
      },
      { createRecurringTask, updateTask, taskRepository: repo, todayEpoch: TODAY_EPOCH },
    );

    expect(createRecurringTask).toHaveBeenCalledOnce();
    const templateArg = createRecurringTask.mock.calls[0][0];
    expect(templateArg.repeat).toBe("weekly");
    expect(templateArg.baseDateHijri).toBe("14460701");
  });

  it("updates the original task with recurringTaskId, repeat, and repeatInterval", async () => {
    const createRecurringTask = makeCreateRecurringTask("rtask_abc");
    const updateTask = makeUpdateTask();
    const repo = makeRepo();

    await promoteTaskToRecurring(
      "task_1",
      BASE_TASK_INPUT,
      "weekly",
      2,
      { name: "Daily standup", baseDateHijri: "14460701", repeat: "weekly", repeatInterval: 2 },
      { createRecurringTask, updateTask, taskRepository: repo, todayEpoch: TODAY_EPOCH },
    );

    expect(updateTask).toHaveBeenCalledOnce();
    const [id, input] = updateTask.mock.calls[0];
    expect(id).toBe("task_1");
    expect(input.recurringTaskId).toBe("rtask_abc");
    expect(input.repeat).toBe("weekly");
    expect(input.repeatInterval).toBe(2);
  });

  it("links the task BEFORE generating occurrences so its date is skipped (no duplicate)", async () => {
    const callOrder: string[] = [];

    const createRecurringTask = vi.fn(async (input: any): Promise<RecurringTask> => {
      callOrder.push("createTemplate");
      return { id: "rtask_abc", user_id: "u", name: input.name, repeat: input.repeat, repeatInterval: 1, baseDateHijri: input.baseDateHijri };
    });

    // When updateTask is called, mark the task as linked
    let linkedTaskDate: string | undefined;
    const updateTask = vi.fn(async (_id: string, input: TaskUpdateInput) => {
      callOrder.push("linkTask");
      linkedTaskDate = input.atDateHijri;
      return new Task({ id: _id, atDateHijri: input.atDateHijri, recurringTaskId: input.recurringTaskId });
    });

    // Repo returns the linked task when queried (simulating the state after updateTask)
    const existingAfterLink = [
      new Task({ id: "task_1", atDateHijri: "14460701", recurringTaskId: "rtask_abc" }),
    ];
    const repo = makeRepo(existingAfterLink);
    (repo.create as ReturnType<typeof vi.fn>).mockImplementation(async (input: any) => {
      callOrder.push("createInstance");
      return new Task({ id: `task_new`, ...input });
    });

    await promoteTaskToRecurring(
      "task_1",
      BASE_TASK_INPUT,
      "weekly",
      1,
      { name: "Daily standup", baseDateHijri: "14460701", repeat: "weekly", repeatInterval: 1 },
      { createRecurringTask, updateTask, taskRepository: repo, todayEpoch: TODAY_EPOCH },
    );

    // Template must be created first, then the task is linked, then instances generated
    expect(callOrder[0]).toBe("createTemplate");
    expect(callOrder[1]).toBe("linkTask");

    // The original task's date should NOT appear among newly created instances
    const created = (repo as any)._created as Task[];
    const createdDates = created.map((t) => t.atDateHijri);
    expect(createdDates).not.toContain("14460701");
  });

  it("generates future instances for the series", async () => {
    const createRecurringTask = makeCreateRecurringTask("rtask_abc");
    const updateTask = makeUpdateTask();
    const repo = makeRepo(); // no existing instances

    await promoteTaskToRecurring(
      "task_1",
      BASE_TASK_INPUT,
      "weekly",
      1,
      { name: "Daily standup", baseDateHijri: "14460701", repeat: "weekly", repeatInterval: 1 },
      { createRecurringTask, updateTask, taskRepository: repo, todayEpoch: TODAY_EPOCH },
    );

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    created.forEach((t) => {
      expect(t.recurringTaskId).toBe("rtask_abc");
    });
  });

  it("returns the result of updateTask", async () => {
    const expectedTask = new Task({ id: "task_1", name: "Daily standup", recurringTaskId: "rtask_abc" });
    const updateTask = vi.fn(async () => expectedTask);
    const repo = makeRepo();

    const result = await promoteTaskToRecurring(
      "task_1",
      BASE_TASK_INPUT,
      "daily",
      1,
      { name: "Daily standup", baseDateHijri: "14460701", repeat: "daily", repeatInterval: 1 },
      { createRecurringTask: makeCreateRecurringTask(), updateTask, taskRepository: repo, todayEpoch: TODAY_EPOCH },
    );

    expect(result).toBe(expectedTask);
  });
});

// ---------------------------------------------------------------------------
// demoteTaskFromRecurring
// ---------------------------------------------------------------------------

describe("demoteTaskFromRecurring", () => {
  it("calls updateTask with recurringTaskId=null, repeat=none", async () => {
    const updateTask = makeUpdateTask();

    await demoteTaskFromRecurring("task_1", BASE_TASK_INPUT, updateTask);

    expect(updateTask).toHaveBeenCalledOnce();
    const [id, input] = updateTask.mock.calls[0];
    expect(id).toBe("task_1");
    expect(input.recurringTaskId).toBeNull();
    expect(input.repeat).toBe("none");
  });

  it("clears repeatInterval", async () => {
    const updateTask = makeUpdateTask();

    await demoteTaskFromRecurring(
      "task_1",
      { ...BASE_TASK_INPUT, repeatInterval: 3 },
      updateTask,
    );

    const [, input] = updateTask.mock.calls[0];
    expect(input.repeatInterval).toBeUndefined();
  });

  it("preserves all other task fields from taskInput", async () => {
    const updateTask = makeUpdateTask();
    const richInput: TaskUpdateInput = {
      ...BASE_TASK_INPUT,
      atTime: "09:00",
      listId: "list_abc",
      timezone: "Asia/Jakarta",
    };

    await demoteTaskFromRecurring("task_1", richInput, updateTask);

    const [, input] = updateTask.mock.calls[0];
    expect(input.atTime).toBe("09:00");
    expect(input.listId).toBe("list_abc");
    expect(input.timezone).toBe("Asia/Jakarta");
    // Conversion fields are overridden
    expect(input.recurringTaskId).toBeNull();
    expect(input.repeat).toBe("none");
  });

  it("returns the result of updateTask", async () => {
    const expectedTask = new Task({ id: "task_1", name: "Daily standup" });
    const updateTask = vi.fn(async () => expectedTask);

    const result = await demoteTaskFromRecurring("task_1", BASE_TASK_INPUT, updateTask);

    expect(result).toBe(expectedTask);
  });

  it("does not touch the recurring task template or other instances", async () => {
    const updateTask = makeUpdateTask();
    // demoteTaskFromRecurring takes no repo — template/instances are untouched by design
    await demoteTaskFromRecurring("task_1", BASE_TASK_INPUT, updateTask);
    // Only one call: the targeted task update
    expect(updateTask).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// demoteTaskFromRecurringAndDeleteFuture
// ---------------------------------------------------------------------------

describe("demoteTaskFromRecurringAndDeleteFuture", () => {
  function makeDeps(existingTasks: Task[] = []) {
    const deleteRecurringTask = vi.fn(async () => {});
    const updateTask = makeUpdateTask();
    const repo = makeRepo(existingTasks);
    return { updateTask, deleteRecurringTask, repo };
  }

  const BASE_RECURRING_TASK = new Task({
    id: "task_1",
    name: "Daily standup",
    atDateHijri: "14460715",
    recurringTaskId: "rtask_abc",
    status: 0,
  });

  it("deletes future pending instances (atDateHijri >= task.atDateHijri, id !== taskId, status !== 1)", async () => {
    const future1 = new Task({ id: "task_2", atDateHijri: "14460716", recurringTaskId: "rtask_abc", status: 0 });
    const future2 = new Task({ id: "task_3", atDateHijri: "14460720", recurringTaskId: "rtask_abc", status: 0 });
    const { updateTask, deleteRecurringTask, repo } = makeDeps([BASE_RECURRING_TASK, future1, future2]);

    await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    expect(repo.delete).toHaveBeenCalledWith("task_2");
    expect(repo.delete).toHaveBeenCalledWith("task_3");
  });

  it("does NOT delete completed future instances (status === 1)", async () => {
    const completed = new Task({ id: "task_2", atDateHijri: "14460720", recurringTaskId: "rtask_abc", status: 1 });
    const { updateTask, deleteRecurringTask, repo } = makeDeps([BASE_RECURRING_TASK, completed]);

    await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    expect(repo.delete).not.toHaveBeenCalledWith("task_2");
  });

  it("does NOT delete past pending instances (atDateHijri < task.atDateHijri)", async () => {
    const past = new Task({ id: "task_0", atDateHijri: "14460710", recurringTaskId: "rtask_abc", status: 0 });
    const { updateTask, deleteRecurringTask, repo } = makeDeps([past, BASE_RECURRING_TASK]);

    await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    expect(repo.delete).not.toHaveBeenCalledWith("task_0");
  });

  it("deletes the rtask_ template", async () => {
    const { updateTask, deleteRecurringTask, repo } = makeDeps([BASE_RECURRING_TASK]);

    await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    expect(deleteRecurringTask).toHaveBeenCalledWith("rtask_abc");
  });

  it("demotes the current task (recurringTaskId=null, repeat=none)", async () => {
    const { updateTask, deleteRecurringTask, repo } = makeDeps([BASE_RECURRING_TASK]);

    await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    const [id, input] = updateTask.mock.calls[0];
    expect(id).toBe("task_1");
    expect(input.recurringTaskId).toBeNull();
    expect(input.repeat).toBe("none");
    expect(input.repeatInterval).toBeUndefined();
  });

  it("returns the result of updateTask", async () => {
    const expected = new Task({ id: "task_1", name: "Daily standup" });
    const updateTask = vi.fn(async () => expected);
    const { deleteRecurringTask, repo } = makeDeps([BASE_RECURRING_TASK]);

    const result = await demoteTaskFromRecurringAndDeleteFuture("task_1", BASE_TASK_INPUT, BASE_RECURRING_TASK, {
      updateTask, deleteRecurringTask, taskRepository: repo,
    });

    expect(result).toBe(expected);
  });
});
