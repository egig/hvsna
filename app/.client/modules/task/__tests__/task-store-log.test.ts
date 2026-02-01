import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTaskStore } from "../task-store";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-1234"),
});

describe("Task Store - Pure Task Operations (No Log Creation)", () => {
  const mockDb = {
    get: vi.fn(),
    put: vi.fn(),
    remove: vi.fn(),
    allDocs: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useTaskStore.getState().reset();
  });

  it("should update task status without creating logs", async () => {
    const taskId = "task_test-uuid-1234";
    const existingTask = {
      _id: taskId,
      _rev: "1-rev",
      user_id: "default-user",
      name: "Test Task",
      status: "pending",
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValueOnce(existingTask);
    mockDb.put.mockResolvedValueOnce({ rev: "2-rev" });

    const store = useTaskStore.getState();
    const updated = await store.updateTask(
      taskId,
      { status: "completed" },
      mockDb,
    );

    expect(updated.status).toBe("completed");

    // Verify only task update was called (no log creation)
    expect(mockDb.put).toHaveBeenCalledTimes(1);
    expect(mockDb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: taskId,
        status: "completed",
      }),
    );
  });

  it("should update task name without creating logs", async () => {
    const taskId = "task_test-uuid-1234";
    const existingTask = {
      _id: taskId,
      _rev: "1-rev",
      user_id: "default-user",
      name: "Test Task",
      status: "pending",
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValueOnce(existingTask);
    mockDb.put.mockResolvedValueOnce({ rev: "2-rev" });

    const store = useTaskStore.getState();
    const updated = await store.updateTask(
      taskId,
      { name: "Updated Task" },
      mockDb,
    );

    expect(updated.name).toBe("Updated Task");

    // Verify only task update was called (no log creation)
    expect(mockDb.put).toHaveBeenCalledTimes(1);
    expect(mockDb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: taskId,
        name: "Updated Task",
      }),
    );
  });

  it("should handle task status re-opening without creating logs", async () => {
    const taskId = "task_test-uuid-1234";
    const existingTask = {
      _id: taskId,
      _rev: "1-rev",
      user_id: "default-user",
      name: "Test Task",
      status: "completed",
      targetValue: 100,
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValueOnce(existingTask);
    mockDb.put.mockResolvedValueOnce({ rev: "2-rev" });

    const store = useTaskStore.getState();
    const updated = await store.updateTask(
      taskId,
      { status: "pending" },
      mockDb,
    );

    expect(updated.status).toBe("pending");

    // Verify only task update was called (no log creation)
    expect(mockDb.put).toHaveBeenCalledTimes(1);
    expect(mockDb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: taskId,
        status: "pending",
      }),
    );
  });
});
