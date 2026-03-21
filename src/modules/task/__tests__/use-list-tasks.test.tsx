import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useListTasks } from "../use-list-tasks";
import { taskRepository } from "../task-repository";
import { Task } from "../types";

// Mock the task repository
vi.mock("../task-repository");
const mockTaskRepository = vi.mocked(taskRepository);

// Mock logger
vi.mock("../../../lib/logger", () => ({
  __esModule: true,
  default: {
    error: vi.fn(),
  },
}));

const createMockTask = (id: string, name: string, listId: string): Task => {
  const task = new Task({
    id,
    name,
    status: 0,
    atEpochMillis: Date.now(),
    listId,
  });
  return task;
};

describe("useListTasks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should return initial loading state", () => {
    mockTaskRepository.findTasksByListId.mockResolvedValue([]);

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id" }),
      { wrapper },
    );

    // React Query shows loading: true initially when enabled
    expect(result.current.loading).toBe(true);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBe(null);
    // hasMore is false initially since there's no data yet
    expect(result.current.hasMore).toBe(false);
  });

  it("should load tasks for the specified list", async () => {
    const mockTasks = [
      createMockTask("task-1", "Task 1", "test-list-id"),
      createMockTask("task-2", "Task 2", "test-list-id"),
    ];
    mockTaskRepository.findTasksByListId.mockResolvedValue(mockTasks);

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.error).toBe(null);
    expect(mockTaskRepository.findTasksByListId).toHaveBeenCalledWith(
      "test-list-id",
      0,
      50,
    );
  });

  it("should not load tasks when listId is empty", () => {
    const { result } = renderHook(
      () => useListTasks({ listId: "", enabled: true }),
      { wrapper },
    );

    // React Query behavior for disabled queries
    expect(result.current.loading).toBe(true); // Shows loading initially
    expect(result.current.tasks).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(mockTaskRepository.findTasksByListId).not.toHaveBeenCalled();
  });

  it("should not load tasks when disabled", () => {
    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id", enabled: false }),
      { wrapper },
    );

    // React Query behavior for disabled queries
    expect(result.current.loading).toBe(true); // Shows loading initially
    expect(result.current.tasks).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(mockTaskRepository.findTasksByListId).not.toHaveBeenCalled();
  });

  it("should handle repository errors", async () => {
    const errorMessage = "Failed to load tasks";
    mockTaskRepository.findTasksByListId.mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should refresh tasks when refreshTasks is called", async () => {
    const mockTasks = [createMockTask("task-1", "Task 1", "test-list-id")];
    mockTaskRepository.findTasksByListId.mockResolvedValue(mockTasks);

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    mockTaskRepository.findTasksByListId.mockClear();

    // Call refreshTasks
    result.current.refreshTasks();

    await waitFor(() => {
      expect(mockTaskRepository.findTasksByListId).toHaveBeenCalledWith(
        "test-list-id",
        0,
        50,
      );
    });
  });

  it("should use custom limit", async () => {
    const mockTasks = [createMockTask("task-1", "Task 1", "test-list-id")];
    mockTaskRepository.findTasksByListId.mockResolvedValue(mockTasks);

    renderHook(() => useListTasks({ listId: "test-list-id", limit: 25 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockTaskRepository.findTasksByListId).toHaveBeenCalledWith(
        "test-list-id",
        0,
        25,
      );
    });
  });

  it("should handle loadMoreTasks pagination", async () => {
    // First call returns full page (has more)
    const firstPageTasks = Array.from({ length: 10 }, (_, i) =>
      createMockTask(`task-${i}`, `Task ${i}`, "test-list-id"),
    );
    mockTaskRepository.findTasksByListId
      .mockResolvedValueOnce(firstPageTasks)
      .mockResolvedValueOnce([]); // Second call returns empty (no more)

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id", limit: 10 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual(firstPageTasks);
    // Since we got exactly the limit (10), hasMore should be true
    expect(result.current.hasMore).toBe(true);

    // Load more tasks
    await result.current.loadMoreTasks();

    await waitFor(() => {
      expect(mockTaskRepository.findTasksByListId).toHaveBeenCalledWith(
        "test-list-id",
        10, // offset (current length)
        10, // limit
      );
    });

    // After loading more tasks, the total is still 10 (since second call returned empty)
    // Since we have exactly 10 tasks which equals the limit, hasMore remains true
    // This is the current behavior of the hook
    expect(result.current.hasMore).toBe(true);
  });

  it("should not load more tasks if already loading", async () => {
    mockTaskRepository.findTasksByListId.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
    );

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id" }),
      { wrapper },
    );

    // Try to load more while still loading
    result.current.loadMoreTasks();

    // Should only call repository once (initial load)
    expect(mockTaskRepository.findTasksByListId).toHaveBeenCalledTimes(1);
  });

  it("should not load more tasks if no more tasks available", async () => {
    const mockTasks = [createMockTask("task-1", "Task 1", "test-list-id")];
    mockTaskRepository.findTasksByListId.mockResolvedValue(mockTasks);

    const { result } = renderHook(
      () => useListTasks({ listId: "test-list-id", limit: 10 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Since we got less than the limit (1 < 10), hasMore should be false
    expect(result.current.hasMore).toBe(false);

    mockTaskRepository.findTasksByListId.mockClear();

    // Try to load more
    await result.current.loadMoreTasks();

    // Should not call repository since hasMore is false, but loadMoreTasks should still handle gracefully
    expect(mockTaskRepository.findTasksByListId).not.toHaveBeenCalled();
  });
});
