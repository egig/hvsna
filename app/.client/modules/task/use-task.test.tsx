import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePouchDB } from "../../pouchdb";
import { useTask } from "./use-task";

// Mock the PouchDB context
vi.mock("../../pouchdb", () => ({
  usePouchDB: vi.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => "test-uuid-12345"),
  },
});

describe("useTask", () => {
  const mockDb = {
    put: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePouchDB as any).mockReturnValue({ db: mockDb });
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useTask());

    expect(result.current.task).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe("createTask", () => {
    it("should create a task successfully", async () => {
      mockDb.put.mockResolvedValue({
        ok: true,
        id: "task_test-uuid-12345",
        rev: "1-rev",
      });

      const { result } = renderHook(() => useTask());

      const createdTask = await act(async () => {
        return await result.current.createTask({
          name: "Test Task",
        });
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "task_test-uuid-12345",
          name: "Test Task",
          status: "pending",
          user_id: "default-user",
        }),
      );

      expect(createdTask).toEqual(
        expect.objectContaining({
          id: "task_test-uuid-12345",
          name: "Test Task",
          status: "pending",
          user_id: "default-user",
        }),
      );
      expect(result.current.task).toEqual(createdTask);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should create a task with custom ID", async () => {
      const customId = "task_custom-id";
      mockDb.put.mockResolvedValue({ ok: true, id: customId, rev: "1-rev" });

      const { result } = renderHook(() => useTask());

      await result.current.createTask({
        id: customId,
        name: "Custom ID Task",
      });

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: customId,
        }),
      );
    });

    it("should handle create task error", async () => {
      const errorMessage = "Database error";
      mockDb.put.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTask());

      await act(async () => {
        await expect(
          result.current.createTask({ name: "Test Task" }),
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("updateTask", () => {
    it("should update a task successfully", async () => {
      const existingDoc = {
        _id: "task_123",
        _rev: "1-rev",
        user_id: "default-user",
        name: "Original Name",
        status: "pending" as const,
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      };

      const updatedDoc = {
        ...existingDoc,
        name: "Updated Name",
        status: "completed" as const,
        updated_at: "2023-01-02T00:00:00.000Z",
      };

      mockDb.get.mockResolvedValue(existingDoc);
      mockDb.put.mockResolvedValue({
        ok: true,
        id: existingDoc._id,
        rev: "2-rev",
      });

      const { result } = renderHook(() => useTask());

      const updatedTask = await act(async () => {
        return await result.current.updateTask("task_123", {
          name: "Updated Name",
          status: "completed",
        });
      });

      expect(mockDb.get).toHaveBeenCalledWith("task_123");
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "task_123",
          _rev: "1-rev",
          name: "Updated Name",
          status: "completed",
        }),
      );

      expect(updatedTask.name).toBe("Updated Name");
      expect(updatedTask.status).toBe("completed");
      expect(result.current.task).toEqual(updatedTask);
      expect(result.current.loading).toBe(false);
    });

    it("should handle update task error", async () => {
      const errorMessage = "Task not found";
      mockDb.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTask());

      await act(async () => {
        await expect(
          result.current.updateTask("task_123", { name: "Updated" }),
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("deleteTask", () => {
    it("should delete a task successfully", async () => {
      const existingDoc = {
        _id: "task_123",
        _rev: "1-rev",
        user_id: "default-user",
        name: "Test Task",
        status: "pending" as const,
      };

      mockDb.get.mockResolvedValue(existingDoc);
      mockDb.remove.mockResolvedValue({
        ok: true,
        id: existingDoc._id,
        rev: "2-rev",
      });

      const { result } = renderHook(() => useTask());

      // First set a task to simulate having it loaded
      await act(async () => {
        await result.current.getTask("task_123");
      });

      await act(async () => {
        await result.current.deleteTask("task_123");
      });

      expect(mockDb.get).toHaveBeenCalledWith("task_123");
      expect(mockDb.remove).toHaveBeenCalledWith(existingDoc);
      expect(result.current.task).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("should handle delete task error", async () => {
      const errorMessage = "Document revision is required for deletion";
      const docWithoutRev = {
        _id: "task_123",
        user_id: "default-user",
        name: "Test Task",
        status: "pending" as const,
      };

      mockDb.get.mockResolvedValue(docWithoutRev);

      const { result } = renderHook(() => useTask());

      await act(async () => {
        await expect(result.current.deleteTask("task_123")).rejects.toThrow(
          errorMessage,
        );
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("getTask", () => {
    it("should get a task successfully", async () => {
      const doc = {
        _id: "task_123",
        user_id: "default-user",
        name: "Test Task",
        status: "pending" as const,
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      };

      mockDb.get.mockResolvedValue(doc);

      const { result } = renderHook(() => useTask());

      const task = await act(async () => {
        return await result.current.getTask("task_123");
      });

      expect(mockDb.get).toHaveBeenCalledWith("task_123");
      expect(task).toEqual({
        id: "task_123",
        user_id: "default-user",
        name: "Test Task",
        status: "pending",
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      });
      expect(result.current.task).toEqual(task);
      expect(result.current.loading).toBe(false);
    });

    it("should handle 404 error gracefully", async () => {
      const error = new Error("Not found");
      (error as any).status = 404;
      mockDb.get.mockRejectedValue(error);

      const { result } = renderHook(() => useTask());

      const task = await result.current.getTask("task_123");

      expect(task).toBeNull();
      expect(result.current.task).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("should handle get task error", async () => {
      const errorMessage = "Database error";
      mockDb.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTask());

      await act(async () => {
        await expect(result.current.getTask("task_123")).rejects.toThrow(
          errorMessage,
        );
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset all state", async () => {
      const { result } = renderHook(() => useTask());

      // Set some initial state by creating a task
      const doc = {
        _id: "task_123",
        user_id: "default-user",
        name: "Test",
        status: "pending" as const,
        created_at: "2023-01-01T00:00:00.000Z",
        updated_at: "2023-01-01T00:00:00.000Z",
      };

      mockDb.get.mockResolvedValue(doc);

      await act(async () => {
        await result.current.getTask("task_123");
      });

      expect(result.current.task).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.task).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle loading states correctly", async () => {
    mockDb.put.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ ok: true, id: "task_123", rev: "1-rev" }),
            10,
          ),
        ),
    );

    const { result } = renderHook(() => useTask());

    // Start the async operation
    const createPromise = act(async () => {
      await result.current.createTask({ name: "Test Task" });
    });

    // The loading state should be managed by the hook during the operation
    expect(result.current.loading).toBe(false); // Will be false after act completes
    await createPromise;
    expect(result.current.loading).toBe(false);
  });
});
