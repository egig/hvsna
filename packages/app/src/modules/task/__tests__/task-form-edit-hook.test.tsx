import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Task } from "@/domain/task";
import type { TaskRepositories } from "@/modules/repositories-context";
import { useTaskFormEdit } from "../task-form-edit-hook";

const mocks = vi.hoisted(() => ({
  taskRepo: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByRecurringTaskId: vi.fn(),
  },
  recurringRepo: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  deleteRecurringTaskSeries: vi.fn(),
  runTaskTransaction: vi.fn(),
  settings: { timezone: "Asia/Jakarta", location: { lat: -6, lng: 106 } },
}));
vi.mock("../task-context", () => ({ useTaskContext: () => mocks }));
vi.mock("../use-task-repository", () => ({
  useTaskRepository: () => mocks.taskRepo,
}));
vi.mock("../use-recurring-task-repository", () => ({
  useRecurringTaskRepository: () => mocks.recurringRepo,
}));
vi.mock("../../settings", () => ({
  useSettings: () => ({ settings: mocks.settings }),
}));
vi.mock("../task-form-helpers", () => ({
  useTaskEpoch: () => (date: Date) => date.getTime(),
}));

const epoch = new Date(2026, 8, 19, 10).getTime();
const task = new Task({
  id: "task_1",
  name: "Task",
  recurringTaskId: "series",
  recurringType: "daily",
  recurringInterval: 1,
  atEpochMillis: epoch,
  atTime: "10:00",
  tags: [],
});
const template = {
  id: "series",
  name: "Task",
  recurringType: "daily",
  recurringInterval: 1,
  baseDateEpoch: epoch,
  recurringEnd: "after_occurrences",
  recurringEndOccurrences: 8,
  useGregorian: true,
};
function form() {
  const data = new FormData();
  data.set("taskName", "Task");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.taskRepo.findById.mockResolvedValue(task);
  mocks.taskRepo.findByRecurringTaskId.mockResolvedValue([]);
  mocks.taskRepo.create.mockImplementation(
    async (input) => new Task({ ...input, id: "materialized" }),
  );
  mocks.taskRepo.update.mockImplementation(
    async (id, input) => new Task({ ...task, ...input, id }),
  );
  mocks.recurringRepo.findById.mockResolvedValue(template);
  mocks.recurringRepo.update.mockImplementation(async (id, input) => ({
    ...template,
    ...input,
    id,
  }));
  mocks.runTaskTransaction.mockImplementation(
    (operation: (repos: TaskRepositories) => Promise<Task>) =>
      operation({
        taskRepository: mocks.taskRepo,
        recurringTaskRepository: mocks.recurringRepo,
      } as unknown as TaskRepositories),
  );
});

async function setup(initialTask?: Task) {
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const onDelete = vi.fn();
  const hook = renderHook(() =>
    useTaskFormEdit(
      String(initialTask?.id ?? task.id),
      onSuccess,
      onError,
      onDelete,
      initialTask,
    ),
  );
  await waitFor(() => expect(hook.result.current.isSubmitting).toBe(false));
  return { ...hook, onSuccess, onError, onDelete };
}

describe("recurring task edit workflow", () => {
  it("loads repeat limits and calendar mode from the template without resetting on rerender", async () => {
    const { result, rerender } = await setup();
    expect(result.current.formData.repeat).toMatchObject({
      end: "after_occurrences",
      endOccurrences: 8,
      useGregorian: true,
    });
    act(() => result.current.updateRepeatConfig({ endOccurrences: 12 }));
    rerender();
    expect(result.current.formData.repeat.endOccurrences).toBe(12);
    expect(mocks.taskRepo.findById).toHaveBeenCalledTimes(1);
  });

  it("opens the scope dialog when turning recurrence off and saves this occurrence", async () => {
    const { result, onSuccess } = await setup();
    act(() => result.current.updateRepeatConfig({ recurringType: "none" }));
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    expect(result.current.showRecurringEditScope).toBe(true);
    expect(mocks.taskRepo.update).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.handleScopeThisOnly();
    });
    expect(mocks.taskRepo.update).toHaveBeenCalledWith(
      "task_1",
      expect.objectContaining({ recurringTaskId: null, recurringType: "none" }),
    );
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it.each([
    { endOccurrences: 12 },
    { end: "on_date" as const, endDate: "2026-10-01" },
    { end: "never" as const },
    { useGregorian: false },
  ])("persists a repeat-only series edit: %j", async (change) => {
    const { result } = await setup();
    act(() => result.current.updateRepeatConfig(change));
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    expect(result.current.showRecurringEditScope).toBe(true);
    const repeat = result.current.formData.repeat;
    await act(async () => {
      await result.current.handleScopeAllFuture();
    });
    expect(mocks.recurringRepo.update).toHaveBeenCalledWith(
      "series",
      expect.objectContaining({
        recurringEnd: repeat.end,
        recurringEndOccurrences:
          repeat.end === "after_occurrences" ? repeat.endOccurrences : null,
        recurringEndEpoch: repeat.end === "on_date" ? expect.any(Number) : null,
        useGregorian: repeat.useGregorian,
      }),
    );
  });

  it("closes an unchanged edit without creating a transaction", async () => {
    const { result, onSuccess } = await setup();
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    expect(result.current.showRecurringEditScope).toBe(false);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(mocks.runTaskTransaction).not.toHaveBeenCalled();
  });

  it("materializes a virtual occurrence before demoting it in the same transaction", async () => {
    const virtual = new Task({
      ...task,
      id: "vtask_series_1",
      isVirtual: true,
    });
    const { result } = await setup(virtual);
    act(() => result.current.updateRepeatConfig({ recurringType: "none" }));
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    await act(async () => {
      await result.current.handleScopeThisOnly();
    });
    expect(mocks.runTaskTransaction).toHaveBeenCalledOnce();
    expect(mocks.taskRepo.update).toHaveBeenCalledWith(
      "materialized",
      expect.objectContaining({ recurringTaskId: null }),
    );
    expect(mocks.recurringRepo.update).toHaveBeenCalledWith(
      "series",
      expect.objectContaining({ occurrenceExceptions: expect.any(Array) }),
    );
  });

  it("keeps the scope dialog available for retry if persistence fails", async () => {
    const { result, onError, onSuccess } = await setup();
    act(() => result.current.updateRepeatConfig({ recurringType: "none" }));
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    mocks.runTaskTransaction.mockRejectedValueOnce(new Error("Write failed"));
    await act(async () => {
      await result.current.handleScopeThisOnly();
    });
    expect(result.current.showRecurringEditScope).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(onError).toHaveBeenCalledWith("Write failed");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("cancelling scope selection performs no writes", async () => {
    const { result } = await setup();
    act(() => result.current.updateRepeatConfig({ recurringType: "none" }));
    await act(async () => {
      await result.current.handleSubmit(form());
    });
    act(() => result.current.setShowRecurringEditScope(false));
    expect(result.current.showRecurringEditScope).toBe(false);
    expect(mocks.runTaskTransaction).not.toHaveBeenCalled();
  });
});
