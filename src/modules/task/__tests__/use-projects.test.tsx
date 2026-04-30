import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjects } from "../use-projects";
import type { Project } from "../types";
import { projectRepository } from "../project-repository";

// Mock the project repository
vi.mock("../project-repository", () => ({
  projectRepository: {
    find: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("useProjects", () => {
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

  it("should initialize with empty projects", async () => {
    const mockProjects: Project[] = [];
    vi.mocked(projectRepository.find).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.projects).toEqual([]);
    });

    expect(projectRepository.find).toHaveBeenCalledWith({});
  });

  it("should create a new project", async () => {
    const mockProjects: Project[] = [];
    const newProject: Project = {
      id: "project_test123",
      name: "Test Project",
      description: "Test Description",
      color: "#3B82F6",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    vi.mocked(projectRepository.find).mockResolvedValue(mockProjects);
    vi.mocked(projectRepository.create).mockResolvedValue(newProject);

    const { result } = renderHook(() => useProjects(), { wrapper });

    const createResult = await result.current.createProject({
      name: "Test Project",
      description: "Test Description",
    });

    expect(createResult).toEqual(newProject);
    expect(projectRepository.create).toHaveBeenCalledWith({
      name: "Test Project",
      description: "Test Description",
    });
  });

  it("should update an existing project", async () => {
    const mockProjects: Project[] = [];
    const updatedProject: Project = {
      id: "project_test123",
      name: "Updated Project",
      description: "Updated Description",
      color: "#EF4444",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    vi.mocked(projectRepository.find).mockResolvedValue(mockProjects);
    vi.mocked(projectRepository.update).mockResolvedValue(updatedProject);

    const { result } = renderHook(() => useProjects(), { wrapper });

    const updateResult = await result.current.updateProject("project_test123", {
      name: "Updated Project",
      color: "#EF4444",
    });

    expect(updateResult).toEqual(updatedProject);
    expect(projectRepository.update).toHaveBeenCalledWith("project_test123", {
      name: "Updated Project",
      color: "#EF4444",
    });
  });

  it("should delete a project", async () => {
    const mockProjects: Project[] = [];
    vi.mocked(projectRepository.find).mockResolvedValue(mockProjects);
    vi.mocked(projectRepository.delete).mockResolvedValue();

    const { result } = renderHook(() => useProjects(), { wrapper });

    const deleteResult = await result.current.deleteProject("project_test123");

    expect(deleteResult).toBe(true);
    expect(projectRepository.delete).toHaveBeenCalledWith(
      "project_test123",
      undefined
    );
  });

  it("should handle search filter", async () => {
    const mockProjects: Project[] = [
      { id: "project1", name: "Work Tasks" } as Project,
      { id: "project2", name: "Personal Tasks" } as Project,
    ];
    vi.mocked(projectRepository.find).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    // Set search filter
    result.current.setSearchTextFilter("Work");

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(projectRepository.find).toHaveBeenCalledWith({ searchText: "Work" });
  });
});
