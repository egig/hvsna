import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskQuery,
} from "../../lib/types/task";
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
  scheduledAtEpochMillis?: number;
  targetId?: string;
  targetValue?: number;
  createdAt?: number;
  updatedAt?: number;
  attributes?: Record<string, any>;
  hijriDate?: string;
  hour?: number;
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
  minute?: number;
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
      hour: doc.hour,
      hijriDateYear: doc.hijriDateYear,
      hijriDateMonth: doc.hijriDateMonth,
      hijriDateDay: doc.hijriDateDay,
      minute: doc.minute,
    };
  }

  private createTaskDocument(): PouchDBTaskDocument {
    return {
      _id: `task_${crypto.randomUUID()}`,
      type: "task",
      userId: "",
      name: "",
      status: "pending",
      scheduledAtEpochMillis: 0,
      targetId: "",
      targetValue: 0,
      createdAt: new Date().valueOf(),
      updatedAt: new Date().valueOf(),
      attributes: {},
      hijriDate: "",
      hour: 0,
      hijriDateYear: 0,
      hijriDateMonth: 0,
      hijriDateDay: 0,
      minute: 0,
    };
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now().valueOf();

    const newTask: Task = {
      id: `task_${crypto.randomUUID()}`,
      name: input.name,
      description: input.description,
      status: input.status || "pending",
      targetId: input.targetId || "",
      targetValue: input.targetValue || 0,
      createdAt: now,
      updatedAt: now,
      attributes: input.attributes || {},
      hijriDate: input.hijriDate || "",
      hour: input.hour || 0,
      hijriDateYear: input.hijriDateYear || 0,
      hijriDateMonth: input.hijriDateMonth || 0,
      hijriDateDay: input.hijriDateDay || 0,
      minute: input.minute || 0,
    };

    if (input.hijriDate) {
      const year = parseInt(input.hijriDate.substring(0, 4));
      const month = parseInt(input.hijriDate.substring(4, 6));
      const day = parseInt(input.hijriDate.substring(6, 8));

      const hijriDate = new HijriDate(
        year,
        month,
        day,
        input.hour,
        input.minute,
        0,
      );
      newTask.hijriDateYear = hijriDate.year;
      newTask.hijriDateMonth = hijriDate.month;
      newTask.hijriDateDay = hijriDate.day;
      newTask.scheduledAtEpochMillis = hijriDate.toDate().valueOf();
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
    }

    if (input.hour !== undefined) {
      updateData.hour = input.hour;
    }

    if (input.hijriDateYear !== undefined) {
      updateData.hijriDateYear = input.hijriDateYear;
    }

    if (input.hijriDateMonth !== undefined) {
      updateData.hijriDateMonth = input.hijriDateMonth;
    }

    if (input.hijriDateDay !== undefined) {
      updateData.hijriDateDay = input.hijriDateDay;
    }

    if (input.minute !== undefined) {
      updateData.minute = input.minute;
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
          "hijriDateYear",
          "hijriDateMonth",
          "hijriDateDay",
          "scheduledAtEpochMillis",
        ],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: "pending",
        hijriDateYear: {
          $gte: null,
        },
        hijriDateMonth: {
          $gte: null,
        },
        hijriDateDay: {
          $gte: null,
        },
        scheduledAtEpochMillis: {
          $gte: null,
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { hijriDateYear: "asc" },
        { hijriDateMonth: "asc" },
        { hijriDateDay: "asc" },
        { scheduledAtEpochMillis: "asc" },
      ],
    };

    if (query?.status) {
      mangoQuery.selector.status = query.status;
    }

    if (query?.targetId) {
      mangoQuery.selector.targetId = query.targetId;
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
        fields: ["type", "hijriDate", "hour", "minute"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        hijriDate: hijriDate,
        hour: {
          $gte: null,
        },
        minute: {
          $gte: null,
        },
      },
      sort: [
        { type: "asc" },
        { hijriDate: "desc" },
        { hour: "asc" },
        { minute: "asc" },
      ],
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
      hour: doc.hour,
      minute: doc.minute,
    }));
  }

  async findTodayTasks(): Promise<Task[]> {
    // TODO tomorrow is sunset or not ?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.createIndex({
      index: {
        fields: ["type", "scheduledAtEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        scheduledAtEpochMillis: {
          $gte: today.getTime(),
          $lt: tomorrow.getTime(),
        },
      },
      sort: [{ type: "asc" }, { scheduledAtEpochMillis: "asc" }],
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
        status: { $ne: "completed" },
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

    console.log(result.docs, mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      this.mapDocumentToTask(doc),
    );
  }
}

// Export singleton instance
export const taskRepository = TaskRepository.getInstance();
