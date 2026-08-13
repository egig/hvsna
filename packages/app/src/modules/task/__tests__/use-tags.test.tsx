import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useTags, normalizeTag } from "../use-tags";
import type { TagWithCount } from "@/domain/tag";

const mockFindAll = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

let mockRepo = {
  findAll: mockFindAll,
  update: mockUpdate,
  delete: mockDelete,
};

vi.mock("../use-tag-repository", () => ({
  useTagRepository: () => mockRepo,
}));

vi.mock("../../logger", () => ({
  default: { error: vi.fn(), info: vi.fn() },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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
  const mockTags: TagWithCount[] = [
    { id: "tag_1", name: "personal", color: "#000000", count: 1, createdAt: 0, updatedAt: 0 },
    { id: "tag_2", name: "urgent", color: "#111111", count: 2, createdAt: 0, updatedAt: 0 },
    { id: "tag_3", name: "work", color: "#222222", count: 2, createdAt: 0, updatedAt: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindAll.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockFindAll.mockResolvedValue(mockTags);
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue(undefined);
    mockRepo = { findAll: mockFindAll, update: mockUpdate, delete: mockDelete };
  });

  it("exposes tags with counts sorted by the repository", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual(mockTags);
    expect(result.current.tags[0].name).toBe("personal");
  });

  it("exposes tagNames list", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tagNames).toEqual(["personal", "urgent", "work"]);
  });

  it("applies the limit option", async () => {
    const { result } = renderHook(() => useTags({ limit: 2 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toHaveLength(2);
  });

  it("handles no tags", async () => {
    mockFindAll.mockResolvedValue([]);

    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tags).toEqual([]);
    expect(result.current.tagNames).toEqual([]);
  });

  it("can delete a tag by resolving its id", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.deleteTag("urgent");

    expect(mockDelete).toHaveBeenCalledWith("tag_2");
  });

  it("can rename a tag by resolving its id", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.renameTag("urgent", "critical");

    expect(mockUpdate).toHaveBeenCalledWith("tag_2", { name: "critical" });
  });

  it("can recolor a tag by resolving its id", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.setTagColor("urgent", "#ff0000");

    expect(mockUpdate).toHaveBeenCalledWith("tag_2", { color: "#ff0000" });
  });

  it("no-ops renaming to the same normalized name", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.renameTag("urgent", " URGENT ");

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
