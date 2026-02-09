import {
  type Task,
  type TaskCreateInput,
  type TaskQuery,
  type TaskStatus,
  type TaskUpdateInput,
} from "src/lib/types/task";
import { generatePrefixedUUID } from "src/lib/uuid";
import { HijriDate } from "../../lib/hijri/hijri-date";
import { db } from "../../lib/pouchdb-singleton";

interface PouchDBTaskDocument {
  _id: string;
  _rev?: string;
  type: "task";
  userId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  unscheduled: number;
  scheduledAtEpochMillis?: number;
  targetId?: string;
  targetValue?: number;
  createdAt?: number;
  updatedAt?: number;
  attributes?: Record<string, any>;
  hijriDate?: string;
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
      scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
      targetId: doc.targetId,
      targetValue: doc.targetValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      attributes: doc.attributes,
      hijriDate: doc.hijriDate,
      unscheduled: doc.unscheduled,
    };
  }

  private createTaskDocument(): PouchDBTaskDocument {
    return {
      _id: generatePrefixedUUID("task_"),
      type: "task",
      userId: "",
      name: "",
      status: 0,
      scheduledAtEpochMillis: 0,
      targetId: "",
      targetValue: 0,
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
      attributes: {},
      hijriDate: "",
      unscheduled: 0,
    };
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now().valueOf();

    const newTask: Task = {
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      targetId: input.targetId || "",
      targetValue: input.targetValue || 0,
      createdAt: now,
      updatedAt: now,
      attributes: input.attributes || {},
      hijriDate: input.hijriDate || "",
      unscheduled: 1,
    };

    if (input.hijriDate) {
      const year = parseInt(input.hijriDate.substring(0, 4));
      const month = parseInt(input.hijriDate.substring(4, 6));
      const day = parseInt(input.hijriDate.substring(6, 8));

      const hijriDate = new HijriDate(year, month, day, 0, 0, 0);
      let gregDate = hijriDate.toDate();
      newTask.scheduledAtEpochMillis = gregDate.setHours(
        input.scheduledAtHour || 0,
        input.scheduledAtMinute || 0,
        0,
        0,
      );
      newTask.unscheduled = 0;
    } else {
      newTask.scheduledAtEpochMillis = 0;
      newTask.unscheduled = 1;
    }

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

    if (input.hijriDate !== undefined) {
      updateData.hijriDate = input.hijriDate;
      const year = parseInt(input.hijriDate.substring(0, 4));
      const month = parseInt(input.hijriDate.substring(4, 6));
      const day = parseInt(input.hijriDate.substring(6, 8));

      const hijriDate = new HijriDate(year, month, day, 0, 0, 0);
      updateData.scheduledAtEpochMillis = hijriDate
        .toDate()
        .setHours(
          input.scheduledAtHour || 0,
          input.scheduledAtMinute || 0,
          0,
          0,
        );
      updateData.unscheduled = 0;
    } else {
      updateData.scheduledAtEpochMillis = 0;
      updateData.unscheduled = 1;
    }

    const response = await (db as any).put(updateData);
    const updatedDoc: PouchDBTaskDocument = {
      ...updateData,
      _rev: response.rev,
    };

    return this.mapDocumentToTask(updatedDoc);
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
          "unscheduled",
          "hijriDate",
          "scheduledAtEpochMillis",
        ],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: 0,
        unscheduled: { $gte: 0 },
        scheduledAtEpochMillis: {
          $gte: null,
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { unscheduled: "asc" },
        { hijriDate: "asc" },
        { scheduledAtEpochMillis: "asc" },
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
        scheduledAtEpochMillis: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
      },
      sort: [{ scheduledAtEpochMillis: "asc" }],
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
      scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
      targetId: doc.targetId,
      targetValue: doc.targetValue,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      hijriDate: doc.hijriDate,
    }));
  }

  async findTodayTasks(): Promise<Task[]> {
    const today = HijriDate.fromDate(new Date());

    await db.createIndex({
      index: {
        fields: ["type", "status", "hijriDate", "scheduledAtEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: {
          $ne: 1,
        },
        hijriDate: today.format("YYYYMMDD"),
        scheduledAtEpochMillis: {
          $gte: today.toDate().valueOf(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { hijriDate: "asc" },
        { scheduledAtEpochMillis: "asc" },
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
        fields: ["type", "status", "scheduledAtEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: { $ne: 1 },
        scheduledAtEpochMillis: {
          $gte: today.toDate().getTime(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { scheduledAtEpochMillis: "asc" },
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
        fields: ["type", "status", "unscheduled", "scheduledAtEpochMillis"],
      },
    });

    // https://github.com/apache/pouchdb/issues/7863
    // 1. Mango does not support mixed sorting
    // 2. sort field need includes all index
    // 3. order matters
    const mangoQuery: any = {
      selector: {
        type: "task",
        status: 0,
        unscheduled: { $gte: 0 },
        scheduledAtEpochMillis: { $gte: 0 },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { unscheduled: "asc" },
        { scheduledAtEpochMillis: "asc" },
      ],
      limit,
      skip: offset,
    };
    // Apply custom filters if provided
    if (query) {
      if (query.status) {
        mangoQuery.selector.status = query.status;
      }
      if (query.scheduledAtEpochMillis) {
        mangoQuery.selector.scheduledAtEpochMillis =
          query.scheduledAtEpochMillis;
      }
      if (query.searchText && query.searchText.trim()) {
        const searchLower = query.searchText.toLowerCase().trim();
        mangoQuery.selector.$or = [
          { name: { $regex: searchLower } },
          { description: { $regex: searchLower } },
        ];
      }
    }

    console.log(mangoQuery);
    const result = await (db as any).find(mangoQuery);

    console.log(result);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }
}

// Export singleton instance
export const taskRepository = TaskRepository.getInstance();
