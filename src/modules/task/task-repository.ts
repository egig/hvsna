import { db } from "../../lib/pouchdb-singleton";
import { HijriDate } from "../../lib/hijri";
import type {
  Task,
  TaskCreateInput,
  TaskQuery,
  TaskStatus,
  TaskUpdateInput,
} from "./types";
import { generatePrefixedUUID } from "../../lib/uuid";

interface PouchDBTaskDocument {
  _id: string;
  _rev?: string;
  type: "task";
  userId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  atDateHijri?: string;
  atDateIsNone: number;
  atTimeIsNone: number;
  atEpochMillis?: number;
  atTime?: string;
  targetId?: string;
  targetValue?: number;
  createdAt?: number;
  updatedAt?: number;
  attributes?: Record<string, any>;
}

export class TaskRepository {
  private static instance: TaskRepository;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): TaskRepository {
    if (!TaskRepository.instance) {
      TaskRepository.instance = new TaskRepository();
    }
    return TaskRepository.instance;
  }

  static resetInstance(): void {
    TaskRepository.instance = null as any;
  }

  private mapDocumentToTask(doc: PouchDBTaskDocument): Task {
    return {
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      description: doc.description,
      status: doc.status,
      atEpochMillis: doc.atEpochMillis,
      targetId: doc.targetId,
      targetValue: doc.targetValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      attributes: doc.attributes,
      atDateHijri: doc.atDateHijri,
      atDateIsNone: doc.atDateIsNone,
      atTimeIsNone: doc.atTimeIsNone,
      atTime: doc.atTime,
    };
  }

  private createTaskDocument(): PouchDBTaskDocument {
    return {
      _id: generatePrefixedUUID("task_"),
      type: "task",
      userId: "",
      name: "",
      status: 0,
      atEpochMillis: 0,
      targetId: "",
      targetValue: 0,
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
      attributes: {},
      atDateHijri: "",
      atDateIsNone: 1,
      atTimeIsNone: 1,
    };
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now().valueOf();

    const newTask: Task = {
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      atDateIsNone: 1,
      atTimeIsNone: 1,
      atDateHijri: input.atDateHijri || "",
      atTime: input.atTime || "",
      createdAt: now,
      updatedAt: now,
      targetId: input.targetId || "",
      targetValue: input.targetValue || 0,
      attributes: input.attributes || {},
    };

    const { atDateHijri, atDateIsNone, atTime, atTimeIsNone, atEpochMillis } =
      this._parseDateTimeInput(input);
    newTask.atDateHijri = atDateHijri;
    newTask.atDateIsNone = atDateIsNone;
    newTask.atTime = atTime;
    newTask.atTimeIsNone = atTimeIsNone;
    newTask.atEpochMillis = atEpochMillis;

    const doc = Object.assign(this.createTaskDocument(), newTask);

    await (db as any).put(doc);

    return newTask;
  }

  async update(id: string, input: TaskUpdateInput): Promise<Task> {
    const existingDoc: PouchDBTaskDocument = await (db as any).get(id);

    const updateData: PouchDBTaskDocument = {
      ...existingDoc,
      updatedAt: Date.now(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.targetId !== undefined) {
      updateData.targetId = input.targetId;
    }

    if (input.targetValue !== undefined) {
      updateData.targetValue = input.targetValue;
    }

    if (input.attributes !== undefined) {
      updateData.attributes = input.attributes;
    }

    if (!!input.atDateHijri) {
      const { atDateHijri, atDateIsNone, atTime, atTimeIsNone, atEpochMillis } =
        this._parseDateTimeInput(input);
      updateData.atDateHijri = atDateHijri;
      updateData.atDateIsNone = atDateIsNone;
      updateData.atTime = atTime;
      updateData.atTimeIsNone = atTimeIsNone;
      updateData.atEpochMillis = atEpochMillis;
    }

    const response = await (db as any).put(updateData);
    const updatedDoc: PouchDBTaskDocument = {
      ...updateData,
      _rev: response.rev,
    };

    return this.mapDocumentToTask(updatedDoc);
  }

  _parseDateTimeInput(input: TaskCreateInput | TaskUpdateInput): {
    atDateHijri: string;
    atTime: string;
    atDateIsNone: number;
    atTimeIsNone: number;
    atEpochMillis: number;
  } {
    let result = {
      atDateHijri: "",
      atTime: "",
      atDateIsNone: 1,
      atTimeIsNone: 1,
      atEpochMillis: null,
    } as any;

    if (!input.atDateHijri) {
      return result;
    }

    result.atDateHijri = input.atDateHijri;
    result.atDateIsNone = 0;
    const year = parseInt(input.atDateHijri.substring(0, 4));
    const month = parseInt(input.atDateHijri.substring(4, 6));
    const day = parseInt(input.atDateHijri.substring(6, 8));

    const hijriDate = new HijriDate(year, month, day, 0, 0, 0);
    result.atEpochMillis = hijriDate.toDate().valueOf();

    if (input.atTime) {
      result.atTime = input.atTime;
      result.atTimeIsNone = 0;
      const [h, m] = input.atTime.split(":");
      result.atEpochMillis = hijriDate
        .toDate()
        .setHours(parseInt(h), parseInt(m), 0, 0);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const doc: PouchDBTaskDocument = await (db as any).get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    await (db as any).remove(doc as any);
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const doc: PouchDBTaskDocument = await (db as any).get(id);
      return this.mapDocumentToTask(doc);
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: TaskQuery): Promise<Task[]> {
    await (db as any).createIndex({
      index: {
        fields: [
          "type",
          "status",
          "atDateIsNone",
          "atDateHijri",
          "atEpochMillis",
        ],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: 0,
        atDateIsNone: { $gte: 0 },
        atEpochMillis: {
          $gte: null,
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atDateIsNone: "asc" },
        { atDateHijri: "asc" },
        { atEpochMillis: "asc" },
      ],
    };

    if (query?.status) {
      mangoQuery.selector.status = query.status;
    }

    if (query?.targetId) {
      mangoQuery.selector.targetId = query.targetId;
    }

    if (query?.searchText && query.searchText.trim()) {
      const searchLower = query.searchText.toLowerCase().trim();
      mangoQuery.selector.$or = [
        { name: { $regex: searchLower } },
        { description: { $regex: searchLower } },
      ];
    }

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }

  async findByDate(date: string): Promise<Task[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const mangoQuery = {
      selector: {
        type: "task",
        atEpochMillis: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
      },
      sort: [{ atEpochMillis: "asc" }],
    };

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }

  async findByHijriDate(hijriDate: string): Promise<Task[]> {
    await (db as any).createIndex({
      index: {
        fields: ["type", "hijriDate"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        hijriDate: hijriDate,
      },
      sort: [{ type: "asc" }, { hijriDate: "desc" }],
    };

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }

  async findWithPagination(
    offset: number,
    limit: number = 20,
  ): Promise<Task[]> {
    const mangoQuery = {
      selector: {
        type: "task",
      },
      sort: [{ _id: "asc" }],
      limit,
      skip: offset,
    };

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) => ({
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      status: doc.status,
      atEpochMillis: doc.atEpochMillis,
      targetId: doc.targetId,
      targetValue: doc.targetValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      atDateHijri: doc.atDateHijri,
    }));
  }

  // Today tasks should list:
  // Not-completed
  // Past due
  async findTodayTasks(): Promise<Task[]> {
    const today = HijriDate.fromDate(new Date());

    await db.createIndex({
      index: {
        fields: [
          "type",
          "status",
          "atDateIsNone",
          "atDateHijri",
          "atTimeIsNone",
          "atEpochMillis",
        ],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atDateIsNone: 0,
        atDateHijri: {
          $gt: null,
        },
        atTimeIsNone: {
          $gte: 0,
        },
        atEpochMillis: {
          // date is less that tomorrow
          // includes "overdue" tasks
          $lt: today.next().toDate().valueOf(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atDateIsNone: "asc" },
        { atDateHijri: "asc" },
        { atTimeIsNone: "asc" },
        { atEpochMillis: "asc" },
      ],
    };

    const result = await (db as any).find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }

  async findUpcomingTasks(): Promise<Task[]> {
    const today = HijriDate.fromDate(new Date());

    await db.createIndex({
      index: {
        fields: ["type", "status", "atDateIsNone", "atEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atDateIsNone: 0,
        atEpochMillis: {
          $gte: today.toDate().valueOf(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atDateIsNone: 0 },
        { atEpochMillis: "asc" },
      ],
    };

    const result = await (db as any).find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }

  async findBrowsedTasks(
    query?: any,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Task[]> {
    await db.createIndex({
      index: {
        fields: ["type", "status", "atDateIsNone", "atEpochMillis"],
      },
    });

    // https://github.com/apache/pouchdb/issues/7863
    // 1. Mango does not support mixed sorting
    // 2. sort field need includes all index
    // 3. order matters
    const mangoQuery: any = {
      selector: {
        type: "task",
        status: {
          $gte: 0,
        },
        atDateIsNone: { $gte: 0 },
        atEpochMillis: { $gte: null },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atDateIsNone: "asc" },
        { atEpochMillis: "asc" },
      ],
      limit,
      skip: offset,
    };
    // Apply custom filters if provided
    if (query) {
      if (query.status) {
        mangoQuery.selector.status = Number(query.status);
      }
      if (query.atEpochMillis) {
        mangoQuery.selector.atEpochMillis = query.atEpochMillis;
      }
      if (query.searchText && query.searchText.trim()) {
        const searchLower = query.searchText.toLowerCase().trim();
        mangoQuery.selector.$or = [
          { name: { $regex: searchLower } },
          { description: { $regex: searchLower } },
        ];
      }

      if (query.atEpochMillis) {
        mangoQuery.selector.atEpochMillis = query.atEpochMillis;
      }
    }

    const result = await (db as any).find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }
}

// Export singleton instance
export const taskRepository = TaskRepository.getInstance();
