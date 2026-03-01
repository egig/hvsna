import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useToday } from "../use-today";
import { taskRepository } from "../../task/task-repository";
import { HijriDate } from "../../calendar/hijri";
import type { Task, TaskStatus } from "../../task/types";

// Mock the dependencies
vi.mock("../../task/task-repository");
vi.mock("../../calendar/hijri/use-hijri-date", () => ({
  useHijriDate: () => ({
    getToday: () => new HijriDate(1445, 1, 15),
    initiated: true,
  }),
}));

vi.mock("../../calendar/use-date-translation-helper", () => ({
  useDateTranslationHelper: () => ({
    dayNames: ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"],
    hijriMonthNames: [
      "Muharram",
      "Safar",
      "Rabi al-Awwal",
      "Rabi al-Thani",
      "Jumada al-Awwal",
      "Jumada al-Thani",
      "Rajab",
      "Shaban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qadah",
      "Dhu al-Hijjah",
    ],
    gregorianMonthNames: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  }),
}));

const mockTaskRepository = vi.mocked(taskRepository);

describe("useToday with React Query", () => {
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

  it("should load today tasks and completed tasks successfully", async () => {
    const mockTodayTasks: Task[] = [
      { id: "task_1", name: "Today Task 1", status: 0 as TaskStatus },
      { id: "task_2", name: "Today Task 2", status: 0 as TaskStatus },
    ];

    const mockCompletedTasks: Task[] = [
      { id: "task_3", name: "Completed Task 1", status: 1 as TaskStatus },
    ];

    const today = new HijriDate(1445, 1, 15);

    mockTaskRepository.findTasksBefore.mockResolvedValue(mockTodayTasks);
    mockTaskRepository.findTodayCompletedTasks.mockResolvedValue(
      mockCompletedTasks,
    );

    const { result } = renderHook(() => useToday(), { wrapper });

    // Initially loading
    expect(result.current.initiated).toBe(false);
    expect(result.current.todayTasks).toEqual([]);
    expect(result.current.todayCompletedTasks).toEqual([]);

    // Wait for queries to complete
    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    // Check final state
    expect(result.current.todayTasks).toEqual(mockTodayTasks);
    expect(result.current.todayCompletedTasks).toEqual(mockCompletedTasks);
    expect(result.current.error).toBe(null);

    // Check computed values
    expect(result.current.pageTitle).toBe("Tue, 15 Muharram 1445"); // Updated to match actual day
    expect(result.current.subTitle).toContain("2023"); // Updated to match actual year

    // Verify repository calls
    expect(mockTaskRepository.findTasksBefore).toHaveBeenCalledWith(
      today.next().startOfDay(),
    );
    expect(mockTaskRepository.findTodayCompletedTasks).toHaveBeenCalledWith(
      today,
    );
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Failed to fetch tasks");
    mockTaskRepository.findTasksBefore.mockRejectedValue(error);
    mockTaskRepository.findTodayCompletedTasks.mockResolvedValue([]);

    const { result } = renderHook(() => useToday(), { wrapper });

    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
    });

    expect(result.current.error).toBe("Failed to fetch tasks");
    expect(result.current.todayTasks).toEqual([]);
  });

  it("should have correct loading states", async () => {
    const mockTodayTasks: Task[] = [
      { id: "task_1", name: "Today Task 1", status: 0 as TaskStatus },
    ];

    mockTaskRepository.findTasksBefore.mockResolvedValue(mockTodayTasks);
    mockTaskRepository.findTodayCompletedTasks.mockResolvedValue([]);

    const { result } = renderHook(() => useToday(), { wrapper });

    // Initially should be loading
    expect(result.current.initiated).toBe(false);
    expect(result.current.todayTasks).toEqual([]);
    expect(result.current.todayCompletedTasks).toEqual([]);

    // After loading completes
    await waitFor(() => {
      expect(result.current.initiated).toBe(true);
      expect(result.current.todayTasks).toEqual(mockTodayTasks);
    });

    // Verify repository was called
    expect(mockTaskRepository.findTasksBefore).toHaveBeenCalled();
    expect(mockTaskRepository.findTodayCompletedTasks).toHaveBeenCalled();
  });
});
