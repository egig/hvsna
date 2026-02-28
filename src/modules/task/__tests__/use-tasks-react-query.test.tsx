import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useTasks } from "../use-tasks";
import { taskRepository } from "../task-repository";
import { TaskProvider } from "../task-context";
import { PouchDBProvider } from "../../../pouchdb";
import { SettingsProvider } from "../../../modules/settings";
import { SystemProvider } from "../../../modules/system";
import type { TaskStatus } from "../types";
import { Task } from "../types";

// Mock the dependencies
vi.mock("../task-repository");
vi.mock("../use-task", () => ({
  useTask: () => ({
    openTaskForm: vi.fn(),
    setEditingTaskId: vi.fn(),
  }),
}));

// Mock PouchDB
vi.mock("pouchdb", () => ({
  default: vi.fn(() => ({
    get: vi.fn(),
    put: vi.fn(),
  })),
}));

// Mock PouchDB singleton
vi.mock("../../../lib/pouchdb-singleton", () => {
  const mockDB = {
    get: vi.fn(),
    put: vi.fn(),
  };
  return {
    default: mockDB,
    db: mockDB,
  };
});

const mockTaskRepository = vi.mocked(taskRepository);

// Mock DB for wrapper
const mockDB = {
  get: vi.fn(),
  put: vi.fn(),
};

describe("useTasks with React Query", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SystemProvider>
        <SettingsProvider>
          <PouchDBProvider dbInstance={mockDB as any}>
            <TaskProvider>{children}</TaskProvider>
          </PouchDBProvider>
        </SettingsProvider>
      </SystemProvider>
    </QueryClientProvider>
  );

  it("should load browsed tasks successfully", async () => {
    const mockBrowsedTasks: Task[] = [
      new Task({
        id: "task_1",
        name: "Browsed Task 1",
        status: 0 as TaskStatus,
      }),
      new Task({
        id: "task_2",
        name: "Browsed Task 2",
        status: 1 as TaskStatus,
      }),
    ];

    mockTaskRepository.findBrowsedTasks.mockResolvedValue(mockBrowsedTasks);

    const { result } = renderHook(() => useTasks(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.initiated).toBe(true); // Set immediately in useEffect
    expect(result.current.tasks).toEqual([]);

    // Wait for queries to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check final state
    expect(result.current.tasks).toEqual(mockBrowsedTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);

    // Verify repository call
    expect(mockTaskRepository.findBrowsedTasks).toHaveBeenCalledWith({}, 0, 50);
  });

  it("should build query with filters correctly", async () => {
    const mockBrowsedTasks: Task[] = [
      new Task({ id: "task_1", name: "Task 1", status: 0 as TaskStatus }),
    ];

    mockTaskRepository.findBrowsedTasks.mockResolvedValue(mockBrowsedTasks);

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Set filters
    result.current.setStatusFilter(1 as TaskStatus);
    result.current.setSearchTextFilter("test search");

    // Trigger refresh to apply filters
    result.current.refreshTasks();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify query was built with filters
    expect(mockTaskRepository.findBrowsedTasks).toHaveBeenCalledWith(
      { status: 1 as TaskStatus, searchText: "test search" },
      0,
      50,
    );
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Failed to fetch browsed tasks");
    mockTaskRepository.findBrowsedTasks.mockRejectedValue(error);

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch browsed tasks");
    expect(result.current.tasks).toEqual([]);
  });

  it("should provide filter actions", () => {
    const { result } = renderHook(() => useTasks(), { wrapper });

    // Test filter actions are available
    expect(typeof result.current.setStatusFilter).toBe("function");
    expect(typeof result.current.setSearchTextFilter).toBe("function");
    expect(typeof result.current.clearFilters).toBe("function");

    // Test calling filter actions
    result.current.setStatusFilter(0 as TaskStatus);
    result.current.setSearchTextFilter("new search");
    result.current.clearFilters();
  });

  it("should provide refresh functionality", async () => {
    const mockTasks: Task[] = [
      new Task({ id: "task_1", name: "Task 1", status: 0 as TaskStatus }),
    ];
    mockTaskRepository.findBrowsedTasks.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Clear mock to track refresh call
    vi.clearAllMocks();
    mockTaskRepository.findBrowsedTasks.mockResolvedValue(mockTasks);

    // Call refresh
    result.current.refreshTasks();

    // Verify refetch was triggered
    expect(mockTaskRepository.findBrowsedTasks).toHaveBeenCalled();
  });
});
