import { describe, it, expect, beforeEach, vi } from "vitest";
import { taskRepository } from "../task-repository";
import { Task } from "../types";
import { db } from "../../../lib/pouchdb-singleton";

// Mock PouchDB
vi.mock("../../../lib/pouchdb-singleton", () => ({
  db: {
    createIndex: vi.fn(),
    find: vi.fn(),
  },
}));

const mockDb = vi.mocked(db);

describe("TaskRepository - findTasksByListId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create the correct index for list queries", async () => {
    mockDb.find.mockResolvedValue({ docs: [] });

    await taskRepository.findTasksByListId("test-list-id");

    expect(mockDb.createIndex).toHaveBeenCalledWith({
      index: {
        fields: ["type", "status", "listId", "atEpochMillis"],
      },
    });
  });

  it("should create the correct mango query", async () => {
    const mockTasks = [
      new Task({
        id: "task-1",
        name: "Test Task 1",
        status: 0,
        listId: "test-list-id",
        atEpochMillis: Date.now(),
      }),
    ];

    mockDb.find.mockResolvedValue({ docs: [mockTasks[0]] });

    await taskRepository.findTasksByListId("test-list-id");

    expect(mockDb.find).toHaveBeenCalledWith({
      selector: {
        type: "task",
        status: { $gte: 0 },
        listId: "test-list-id",
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { listId: "asc" },
        { atEpochMillis: "asc" },
      ],
      limit: 50,
      skip: 0,
    });
  });

  it("should use custom offset and limit", async () => {
    mockDb.find.mockResolvedValue({ docs: [] });

    await taskRepository.findTasksByListId("test-list-id", 10, 25);

    expect(mockDb.find).toHaveBeenCalledWith({
      selector: {
        type: "task",
        status: { $gte: 0 },
        listId: "test-list-id",
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { listId: "asc" },
        { atEpochMillis: "asc" },
      ],
      limit: 25,
      skip: 10,
    });
  });

  it("should return mapped Task objects", async () => {
    const mockDoc = {
      _id: "task-1",
      _rev: "1-rev",
      type: "task",
      name: "Test Task",
      status: 0,
      listId: "test-list-id",
      atEpochMillis: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockDb.find.mockResolvedValue({ docs: [mockDoc] });

    const result = await taskRepository.findTasksByListId("test-list-id");

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Task);
    expect(result[0].id).toBe("task-1");
    expect(result[0].name).toBe("Test Task");
    expect(result[0].listId).toBe("test-list-id");
  });

  it("should handle empty results", async () => {
    mockDb.find.mockResolvedValue({ docs: [] });

    const result = await taskRepository.findTasksByListId("test-list-id");

    expect(result).toEqual([]);
  });
});
