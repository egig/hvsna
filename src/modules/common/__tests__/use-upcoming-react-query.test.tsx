import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useUpcoming } from "../use-upcoming";
import { taskRepository } from "../../task/task-repository";
import { HijriDate } from "../../calendar/hijri";
import type { Task, TaskStatus } from "../../task/types";

// Mock the dependencies
vi.mock("../../task/task-repository");
vi.mock("../../calendar/hijri/use-hijri-date", () => ({
  useHijriDate: () => ({
    getToday: () => new HijriDate(1445, 1, 15),
    getTomorrow: () => new HijriDate(1445, 1, 16),
    toHijriDate: (date: Date) => new HijriDate(1445, 1, 15),
    formatDate: (date: HijriDate, format: string) => {
      if (format === "D MMMM") {
        return `${date.day} Muharram`;
      } else if (format === "MMMM") {
        return "Muharram";
      }
      return `${date.day} Muharram ${date.year}`;
    },
    createHijriDate: (year: number, month: number, day: number) =>
      new HijriDate(year, month, day),
  }),
}));

const mockTaskRepository = vi.mocked(taskRepository);

describe("useUpcoming with React Query", () => {
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should load upcoming tasks successfully", async () => {
    const mockUpcomingTasks: Task[] = [
      {
        id: "task_1",
        name: "Upcoming Task 1",
        status: 0 as TaskStatus,
        atDateHijri: "14450116",
        atEpochMillis: new HijriDate(1445, 1, 16).toDate().getTime(),
        isOverdue: () => false,
      },
      {
        id: "task_2",
        name: "Upcoming Task 2",
        status: 0 as TaskStatus,
        atDateHijri: "14450117",
        atEpochMillis: new HijriDate(1445, 1, 17).toDate().getTime(),
        isOverdue: () => false,
      },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockUpcomingTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.initiated).toBe(false);
    expect(result.current.upcomingTasks).toEqual([]);

    // Wait for queries to complete
    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Check final state
    expect(result.current.upcomingTasks).toEqual(mockUpcomingTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify repository call
    expect(mockTaskRepository.findTasksAfter).toHaveBeenCalled();
  });

  it("should group tasks by time period correctly", async () => {
    // Create simple test with just basic structure validation
    const mockTasks: Task[] = [
      {
        id: "task_1",
        name: "Task 1",
        status: 0 as TaskStatus,
        atEpochMillis: null,
        isOverdue: () => false,
      },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    const groups = result.current.taskGroups;

    // Check that the structure has the new format with labels and tasks
    expect(groups).toHaveProperty("today.tasks");
    expect(groups).toHaveProperty("today.label");
    expect(groups).toHaveProperty("tomorrow.tasks");
    expect(groups).toHaveProperty("tomorrow.label");
    expect(groups).toHaveProperty("thisWeek.tasks");
    expect(groups).toHaveProperty("thisWeek.label");
    expect(groups).toHaveProperty("thisMonth.tasks");
    expect(groups).toHaveProperty("thisMonth.label");
    expect(groups).toHaveProperty("later.tasks");
    expect(groups).toHaveProperty("later.label");
    expect(groups).toHaveProperty("unscheduled.tasks");
    expect(groups).toHaveProperty("unscheduled.label");

    // Check that unscheduled task is grouped correctly
    expect(groups.unscheduled.tasks).toHaveLength(1);
    expect(groups.unscheduled.tasks[0].name).toBe("Task 1");
    expect(groups.unscheduled.label).toBe("");

    // Check that the hook returns the additional date information
    expect(result.current.today).toBeDefined();
    expect(result.current.tomorrow).toBeDefined();
    expect(result.current.endOfWeek).toBeDefined();
    expect(result.current.formatDate).toBeDefined();

    // Check that labels are generated (but empty since we moved label generation to component)
    expect(groups.today.label).toBe("");
    expect(groups.tomorrow.label).toBe("");
    expect(groups.thisWeek.label).toBe("");
    expect(groups.thisMonth.label).toBe("");
    expect(groups.later.label).toBe("");
    expect(groups.unscheduled.label).toBe("");
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Failed to fetch upcoming tasks");
    mockTaskRepository.findTasksAfter.mockRejectedValue(error);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    expect(result.current.error).toBe("Failed to fetch upcoming tasks");
    expect(result.current.upcomingTasks).toEqual([]);
  });

  it("should format scheduled dates correctly", async () => {
    const mockTasks: Task[] = [
      {
        id: "task_1",
        name: "Task with date",
        status: 0 as TaskStatus,
        atDateHijri: "14450115",
        atEpochMillis: new HijriDate(1445, 1, 15).toDate().getTime(),
        isOverdue: () => false,
      },
      {
        id: "task_2",
        name: "Task without date",
        status: 0 as TaskStatus,
        atEpochMillis: null,
        isOverdue: () => false,
      },
    ];

    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Test date formatting
    expect(result.current.formatScheduledDate(mockTasks[0])).toBe(
      "15 Muharram 1445",
    );
    expect(result.current.formatScheduledDate(mockTasks[1])).toBe(
      "No date set",
    );
  });

  it("should refresh tasks when called", async () => {
    const mockTasks: Task[] = [
      {
        id: "task_1",
        name: "Task 1",
        status: 0 as TaskStatus,
        atEpochMillis: null,
        isOverdue: () => false,
      },
    ];
    mockTaskRepository.findTasksAfter.mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useUpcoming(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Clear the mock to track new calls
    vi.clearAllMocks();

    // Call refresh
    await result.current.refreshTasks();

    // Verify refetch was called
    expect(mockTaskRepository.findTasksAfter).toHaveBeenCalled();
  });
});
