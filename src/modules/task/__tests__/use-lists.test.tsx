import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLists } from "../use-lists";
import type { List } from "../types";
import { listRepository } from "../list-repository";

// Mock the list repository
vi.mock("../list-repository", () => ({
  listRepository: {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("useLists", () => {
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

  it("should initialize with empty lists", async () => {
    const mockLists: List[] = [];
    vi.mocked(listRepository.find).mockResolvedValue(mockLists);

    const { result } = renderHook(() => useLists(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.lists).toEqual([]);
    });

    expect(listRepository.find).toHaveBeenCalledWith({});
  });

  it("should create a new list", async () => {
    const mockLists: List[] = [];
    const newList: List = {
      id: "list_test123",
      name: "Test List",
      description: "Test Description",
      color: "#3B82F6",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    vi.mocked(listRepository.find).mockResolvedValue(mockLists);
    vi.mocked(listRepository.create).mockResolvedValue(newList);

    const { result } = renderHook(() => useLists(), { wrapper });

    const createResult = await result.current.createList({
      name: "Test List",
      description: "Test Description",
    });

    expect(createResult).toEqual(newList);
    expect(listRepository.create).toHaveBeenCalledWith({
      name: "Test List",
      description: "Test Description",
    });
  });

  it("should update an existing list", async () => {
    const mockLists: List[] = [];
    const updatedList: List = {
      id: "list_test123",
      name: "Updated List",
      description: "Updated Description",
      color: "#EF4444",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    vi.mocked(listRepository.find).mockResolvedValue(mockLists);
    vi.mocked(listRepository.update).mockResolvedValue(updatedList);

    const { result } = renderHook(() => useLists(), { wrapper });

    const updateResult = await result.current.updateList("list_test123", {
      name: "Updated List",
      color: "#EF4444",
    });

    expect(updateResult).toEqual(updatedList);
    expect(listRepository.update).toHaveBeenCalledWith("list_test123", {
      name: "Updated List",
      color: "#EF4444",
    });
  });

  it("should delete a list", async () => {
    const mockLists: List[] = [];
    vi.mocked(listRepository.find).mockResolvedValue(mockLists);
    vi.mocked(listRepository.delete).mockResolvedValue();

    const { result } = renderHook(() => useLists(), { wrapper });

    const deleteResult = await result.current.deleteList("list_test123");

    expect(deleteResult).toBe(true);
    expect(listRepository.delete).toHaveBeenCalledWith("list_test123", undefined);
  });

  it("should handle search filter", async () => {
    const mockLists: List[] = [
      { id: "list1", name: "Work Tasks" } as List,
      { id: "list2", name: "Personal Tasks" } as List,
    ];
    vi.mocked(listRepository.find).mockResolvedValue(mockLists);

    const { result } = renderHook(() => useLists(), { wrapper });

    // Set search filter
    result.current.setSearchTextFilter("Work");

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(listRepository.find).toHaveBeenCalledWith({ searchText: "Work" });
  });
});
