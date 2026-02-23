import { db } from "../../lib/pouchdb-singleton";
import { HijriDate } from "../calendar/hijri";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import type {
  Task,
  TaskCreateInput,
  TaskQuery,
  TaskStatus,
  TaskUpdateInput,
  PrayerTime,
} from "./types";
import { generatePrefixedUUID } from "../../lib/uuid";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";

class PouchDBTaskDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "task" = "task";
  userId?: string;
  name?: string;
  description?: string;
  status?: TaskStatus = 0;
  atDateHijri?: string = "";
  atDateIsNone?: number = 1;
  atTimeIsNone?: number = 1;
  atEpochMillis?: number | null = null;
  atTime?: string = "";
  targetId?: string = "";
  targetValue?: number = 0;
  createdAt: number = new Date().valueOf();
  updatedAt: number = new Date().valueOf();
  attributes?: Record<string, any> = {};
  prayerTime?: PrayerTime;
  usePrayerTime?: boolean = false;
  lat?: number;
  long?: number;
  timezone?: string;

  constructor(o: any) {
    Object.assign(this, o);
  }

  toTaskItem(): Task {
    return {
      id: this._id || "",
      rev: this._rev,
      userId: this.userId || "",
      name: this.name || "",
      description: this.description || "",
      status: this.status || 0,
      atEpochMillis: this.atEpochMillis || 0,
      targetId: this.targetId || "",
      targetValue: this.targetValue || 0,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      attributes: this.attributes || {},
      atDateHijri: this.atDateHijri || "",
      atDateIsNone: this.atDateIsNone || 1,
      atTimeIsNone: this.atTimeIsNone || 1,
      atTime: this.atTime || "",
      prayerTime: this.prayerTime,
      usePrayerTime: this.usePrayerTime || false,
      lat: this.lat,
      long: this.long,
      timezone: this.timezone,
    };
  }

  static fromTaskItem(t: Task) {
    let a = new PouchDBTaskDocument(t);

    a._id = t.id;
    a._rev = t.rev;
    a.usePrayerTime = !!t.prayerTime;
    a.atTimeIsNone = !!t.atTime ? 0 : 1;
    a.atDateIsNone = !!t.atDateHijri ? 0 : 1;

    if (!!t.atDateHijri) {
      const { year, month, day } = parseHijriDateString(t.atDateHijri);
      let hour = undefined;
      let minute = undefined;
      if (t.atTime) {
        const timeParts = parseTimeString(t.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      a.atEpochMillis = HijriDate.hijriToJsDate(
        year,
        month,
        day,
        hour,
        minute,
        t.lat,
        t.long,
        {
          offset: t.hijriDateOffset || 0,
        },
      ).valueOf();
    }

    return a;
  }
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

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now().valueOf();

    const newTask: Task = {
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      atDateHijri: input.atDateHijri || "",
      atTime: input.atTime || "",
      createdAt: now,
      updatedAt: now,
      targetId: input.targetId || "",
      targetValue: input.targetValue || 0,
      attributes: input.attributes || {},
      prayerTime: input.prayerTime,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
    };

    const doc = PouchDBTaskDocument.fromTaskItem(newTask);
    delete doc._rev;
    console.log(doc);
    await (db as any).put(doc);

    return newTask;
  }

  async update(id: string, input: TaskUpdateInput): Promise<Task> {
    const existingDoc = await (db as any).get(id);

    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toTaskItem();

    // Check if field are inputted / undefined
    // TODO handle remove time or
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined),
      ),
    );

    let ud = PouchDBTaskDocument.fromTaskItem(updateData);
    const response = await (db as any).put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
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
      return new PouchDBTaskDocument(doc).toTaskItem();
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
      new PouchDBTaskDocument(doc).toTaskItem(),
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
      new PouchDBTaskDocument(doc).toTaskItem(),
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
      new PouchDBTaskDocument(doc).toTaskItem(),
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
  async findTodayTasks(todayHijri: HijriDate): Promise<Task[]> {
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
          $lt: todayHijri.next().toDate().valueOf(),
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
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findUpcomingTasks(todayHijri: HijriDate): Promise<Task[]> {
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
          $gte: todayHijri.toDate().valueOf(),
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
      new PouchDBTaskDocument(doc).toTaskItem(),
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
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }
}

// Export singleton instance
export const taskRepository = TaskRepository.getInstance();
