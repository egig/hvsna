import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useTags, normalizeTag } from "../use-tags";

const mockGetTasks = vi.fn();
const mockGetAllPendingTasks = vi.fn();
const mockUpdateTask = vi.fn();

// Mock the task repository hook
let mockRepo = {
  findBrowsedTasks: mockGetTasks,
  findAllPending: mockGetAllPendingTasks,
  update: mockUpdateTask,
};

vi.mock("../use-task-repository", () => ({
  useTaskRepository: () => mockRepo,
}));

// Mock logger
vi.mock("../../logger", () => ({
  default: { error: vi.fn(), info: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("normalizeTag", () => {
  it("trims and lowercases tags", () => {
    expect(normalizeTag("  Work  ")).toBe("work");
    expect(normalizeTag("URGENT")).toBe("urgent");
    expect(normalizeTag("mixed Case")).toBe("mixed case");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("   ")).toBe("");
  });
});

describe("useTags", () => {
  const mockTasks = [
    { id: "task_1", tags: ["work", "urgent"] },
    { id: "task_2", tags: ["work", "personal"] },
    { id: "task_3", tags: ["urgent"] },
    { id: "task_4", tags: [] },
    { id: "task_5", tags: undefined },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTasks.mockReset();
    mockUpdateTask.mockReset();
    mockGetTasks.mockResolvedValue(mockTasks);
    mockGetAllPendingTasks.mockResolvedValue(mockTasks);
    mockUpdateTask.mockResolvedValue({});
    mockRepo = {
      findBrowsedTasks: mockGetTasks,
      findAllPending: mockGetAllPendingTasks,
      update: mockUpdateTask,
    };
  });

  it("extracts unique tags with counts from tasks", async () => {
    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const tags = result.current.tags;
    expect(tags).toHaveLength(3);
    expect(tags).toContainEqual({ name: "work", count: 2 });
    expect(tags).toContainEqual({ name: "urgent", count: 2 });
    expect(tags).toContainEqual({ name: "personal", count: 1 });
    expect(tags[0].name).toBe("personal"); // sorted alphabetically
  });

  it("exposes tagNames list", async () => {
    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tagNames).toEqual(["personal", "urgent", "work"]);
  });

  it("handles tasks with no tags", async () => {
    const noTagTasks = [{ id: "task_1", tags: undefined }, { id: "task_2" }];
    mockGetTasks.mockResolvedValue(noTagTasks);
    mockGetAllPendingTasks.mockResolvedValue(noTagTasks);

    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([]);
    expect(result.current.tagNames).toEqual([]);
  });

  it("normalizes tags during extraction", async () => {
    const normalizedTasks = [
      { id: "task_1", tags: ["Work", "WORK", " work "] },
    ];
    mockGetTasks.mockResolvedValue(normalizedTasks);
    mockGetAllPendingTasks.mockResolvedValue(normalizedTasks);

    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([{ name: "work", count: 3 }]);
  });

  it("can delete a tag", async () => {
    const updateTask = vi.fn().mockResolvedValue({});
    mockGetTasks.mockResolvedValue(mockTasks);
    mockUpdateTask.mockImplementation(updateTask);

    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.deleteTag("urgent");

    expect(updateTask).toHaveBeenCalledTimes(2);
    expect(updateTask).toHaveBeenCalledWith("task_1", { tags: ["work"] });
    expect(updateTask).toHaveBeenCalledWith("task_3", { tags: null });
  });

  it("can rename a tag", async () => {
    const updateTask = vi.fn().mockResolvedValue({});
    mockGetTasks.mockResolvedValue(mockTasks);
    mockUpdateTask.mockImplementation(updateTask);

    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.renameTag("urgent", "critical");

    expect(updateTask).toHaveBeenCalledTimes(2);
    expect(updateTask).toHaveBeenCalledWith("task_1", {
      tags: ["work", "critical"],
    });
    expect(updateTask).toHaveBeenCalledWith("task_3", {
      tags: ["critical"],
    });
  });
});
