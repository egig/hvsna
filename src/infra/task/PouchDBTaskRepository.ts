import type {
  TaskCreateInput,
  TaskQuery,
  TaskRecurringType,
  TaskStatus,
  TaskUpdateInput,
} from "@/domain/task";

function toMangoEpochRange(
  range: number | { from?: number; to?: number }
): any {
  if (typeof range === "number") return range;
  const mango: { $gte?: number; $lte?: number } = {};
  if (range.from !== undefined) mango.$gte = range.from;
  if (range.to !== undefined) mango.$lte = range.to;
  return mango;
}
import { Task } from "@/domain/task";
import { generatePrefixedUUID } from "../../modules/uuid";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";

class PouchDBTaskDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "task" = "task";
  name?: string;
  description?: string;
  status?: TaskStatus = 0;
  atEpochMillis?: number | null = null;
  atTime?: string = "";
  createdAt: number | undefined;
  updatedAt: number = new Date().valueOf();
  completedAt?: number;
  attributes?: Record<string, any> = {};
  lat?: number;
  long?: number;
  hijriDateOffset?: number;
  timezone?: string;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringTaskId?: string;
  tags?: string[] | null = null;
  deletedAt?: number;

  constructor(o: any) {
    // o must be data from pouchdb
    Object.assign(this, o);
  }

  toTaskItem(): Task {
    return new Task({
      id: this._id || "",
      rev: this._rev,
      name: this.name || "",
      description: this.description || "",
      status: this.status !== undefined ? this.status : 0,
      atEpochMillis: this.atEpochMillis || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      atTime: this.atTime || "",
      lat: this.lat,
      long: this.long,
      timezone: this.timezone,
      hijriDateOffset: this.hijriDateOffset,
      recurringType: this.recurringType,
      recurringInterval: this.recurringInterval,
      recurringTaskId: this.recurringTaskId,
      tags: this.tags,
      deletedAt: this.deletedAt,
    });
  }

  static fromTaskItem(t: Task) {
    let a = new PouchDBTaskDocument(t);
    a._id = t.id !== undefined ? String(t.id) : undefined;
    a._rev = t.rev;
    a.atEpochMillis = t.atEpochMillis ?? null;
    a.lat = t.lat;
    a.long = t.long;
    a.hijriDateOffset = t.hijriDateOffset;
    a.tags = t.tags || [];
    a.deletedAt = t.deletedAt;

    return a;
  }
}

export class PouchDBTaskRepository implements ITaskRepository {
  constructor(private readonly db: PouchDB.Database) {}

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now().valueOf();

    const newTask = new Task({
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      atEpochMillis: input.atEpochMillis ?? null,
      atTime: input.atTime || "",
      createdAt: now,
      updatedAt: now,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset || 0,
      recurringType: input.recurringType,
      recurringInterval: input.recurringInterval,
      recurringTaskId: input.recurringTaskId,
      tags: input.tags,
    });

    const doc = PouchDBTaskDocument.fromTaskItem(newTask);
    delete doc._rev;

    await this.db.put(doc);

    return newTask;
  }

  async update(id: string, input: TaskUpdateInput): Promise<Task> {
    const existingDoc = await this.db.get(id);
    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toTaskItem();

    // Check if field are inputted / undefined
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined)
      )
    );

    if (!!input.atTime) {
      updateData.atTime = input.atTime;
    } else if (input.removeTime) {
      updateData.atTime = "";
    }

    let ud = PouchDBTaskDocument.fromTaskItem(updateData);

    const response = await this.db.put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
  }

  async delete(id: string): Promise<void> {
    const doc: PouchDBTaskDocument = await this.db.get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    // Soft delete: set deletedAt timestamp instead of removing the document
    doc.deletedAt = Date.now();
    doc.updatedAt = Date.now();

    await this.db.put(doc as any);
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const doc: PouchDBTaskDocument = await this.db.get(id);
      // Return null if the document is soft-deleted
      if (doc.deletedAt) {
        return null;
      }
      return new PouchDBTaskDocument(doc).toTaskItem();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: TaskQuery): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: 0,
        atEpochMillis: {
          $gte: null,
        },
        deletedAt: null,
      },
      sort: [{ type: "asc" }, { status: "asc" }, { atEpochMillis: "asc" }],
    };

    if (query?.status) {
      mangoQuery.selector.status = query.status;
    }

    if (query?.searchText && query.searchText.trim()) {
      const searchLower = query.searchText.toLowerCase().trim();
      mangoQuery.selector.$or = [
        { name: { $regex: searchLower } },
        { description: { $regex: searchLower } },
      ];
    }

    if (query?.tags && query.tags.length > 0) {
      mangoQuery.selector.tags = { $in: query.tags };
    }

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findByDate(date: string): Promise<Task[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    await this.db.createIndex({
      index: {
        fields: ["type", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        atEpochMillis: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
        deletedAt: null,
      },
      sort: [{ atEpochMillis: "asc" as const }],
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findByHijriDate(hijriDate: string): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "hijriDate", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        hijriDate: hijriDate,
        deletedAt: null,
      },
      sort: [{ type: "asc" }, { hijriDate: "desc" }] as any,
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findWithPagination(
    offset: number,
    limit: number = 20
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        deletedAt: null,
      },
      sort: [{ _id: "asc" as const }],
      limit,
      skip: offset,
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) => ({
      id: doc._id,
      name: doc.name,
      status: doc.status,
      atEpochMillis: doc.atEpochMillis,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  async findTasksBefore(beforeEpoch: number): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atEpochMillis: {
          $gt: null,
          $lte: beforeEpoch,
        },
        deletedAt: null,
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findTodayCompletedTasks(
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "completedAt", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 1, // completed status
        completedAt: {
          $gte: startEpoch,
          $lte: endEpoch,
        },
        deletedAt: { $exists: false },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { completedAt: "desc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async completeTask(id: string): Promise<Task> {
    const existingDoc = await this.db.get(id);
    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      status: 1, // completed status
      completedAt: Date.now(), // set completion timestamp
      updatedAt: Date.now(),
    }).toTaskItem();

    const ud = PouchDBTaskDocument.fromTaskItem(updateData);
    const response = await this.db.put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
  }

  async reopenTask(id: string): Promise<Task> {
    const existingDoc = await this.db.get(id);
    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      status: 0, // pending status
      completedAt: undefined, // clear completion timestamp
      updatedAt: Date.now(),
    }).toTaskItem();

    const ud = PouchDBTaskDocument.fromTaskItem(updateData);
    const response = await this.db.put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
  }

  async findTasksAfter(fromEpoch: number): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atEpochMillis: {
          $gte: fromEpoch,
        },
        deletedAt: null,
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findAllPending(limit: number): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atEpochMillis: { $gte: null },
        deletedAt: { $exists: false },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atEpochMillis: "asc" },
        { deletedAt: "asc" },
      ] as any,
      limit,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findAllCompleted(offset: number, limit: number): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "completedAt", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 1,
        completedAt: { $exists: true },
        deletedAt: { $exists: false },
      },
      sort: [
        { type: "desc" },
        { status: "desc" },
        { completedAt: "desc" },
      ] as any,
      skip: offset,
      limit,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findPendingInRange(
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        atEpochMillis: { $gte: startEpoch, $lte: endEpoch },
        deletedAt: { $exists: false },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findBrowsedTasks(
    query?: TaskQuery,
    offset: number = 0,
    limit: number = 50
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "atEpochMillis", "tags", "deletedAt"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: { $gte: 0 },
        atEpochMillis: { $gte: null },
        tags: { $gte: null },
        deletedAt: { $exists: false },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { atEpochMillis: "asc" },
        { tags: "asc" },
      ] as any,
      limit,
      skip: offset,
    };

    // Apply custom filters if provided
    if (query) {
      if (query.status !== undefined) {
        mangoQuery.selector.status = Number(query.status);
      }
      if (query.atEpochMillis) {
        mangoQuery.selector.atEpochMillis = toMangoEpochRange(
          query.atEpochMillis
        );
      }
      if (query.searchText && query.searchText.trim()) {
        const searchLower = query.searchText.toLowerCase().trim();
        mangoQuery.selector.$or = [
          { name: { $regex: searchLower } },
          { description: { $regex: searchLower } },
        ];
      }
      if (query.unscheduled !== undefined) {
        mangoQuery.selector.atEpochMillis = { $eq: null };
      }
      if (query.tags && query.tags.length > 0) {
        mangoQuery.selector.tags = { $in: query.tags };
      }
    }
    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findUnscheduledTasks(): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "atEpochMillis", "status", "createdAt", "deletedAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        atEpochMillis: { $eq: null }, // No schedule
        status: 0, // Not completed
        createdAt: { $gte: null },
        deletedAt: null,
      },
      sort: [
        { type: "asc" },
        { atEpochMillis: "asc" },
        { createdAt: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findByRecurringTaskId(recurringTaskId: string): Promise<Task[]> {
    await this.db.createIndex({
      index: { fields: ["type", "recurringTaskId", "deletedAt"] },
    });

    const result = await this.db.find({
      selector: {
        type: "task",
        recurringTaskId,
        deletedAt: null,
      },
      limit: 2147483647,
    });

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findByRecurringTaskIdInRange(
    recurringTaskId: string,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: { fields: ["type", "recurringTaskId", "atEpochMillis"] },
    });

    const result = await this.db.find({
      selector: {
        type: "task",
        recurringTaskId,
        atEpochMillis: { $gte: startEpoch, $lte: endEpoch },
      },
      limit: 2147483647,
    });

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string): Promise<void> {
    const tasks = await this.findByRecurringTaskId(recurringTaskId);
    const pending = tasks.filter((t) => t.status !== 1);
    await Promise.all(pending.map((t) => this.delete(String(t.id!))));
  }
}
