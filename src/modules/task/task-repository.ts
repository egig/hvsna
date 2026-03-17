import { db } from "../../lib/pouchdb-singleton";
import { HijriDate } from "../calendar/hijri";
import type {
  TaskCreateInput,
  TaskQuery,
  TaskStatus,
  TaskUpdateInput,
  PrayerTime,
  List,
  ListCreateInput,
  ListUpdateInput,
  ListQuery,
} from "./types";
import { Task, List as ListClass } from "./types";
import { generatePrefixedUUID } from "../../lib/uuid";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";

class PouchDBTaskDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "task" = "task";
  name?: string;
  description?: string;
  status?: TaskStatus = 0;
  atDateHijri?: string = "";
  noDate?: number = 1;
  atEpochMillis?: number | null = null;
  atTime?: string = "";
  createdAt: number = new Date().valueOf();
  updatedAt: number = new Date().valueOf();
  completedAt?: number;
  attributes?: Record<string, any> = {};
  prayerTime?: PrayerTime;
  usePrayerTime?: boolean = false;
  lat?: number;
  long?: number;
  hijriDateOffset?: number;
  timezone?: string;
  listId?: string;

  constructor(o: any) {
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
      attributes: this.attributes || {},
      atDateHijri: this.atDateHijri || "",
      noDate: this.noDate !== undefined ? this.noDate : 1,
      atTime: this.atTime || "",
      prayerTime: this.prayerTime,
      usePrayerTime: this.usePrayerTime || false,
      lat: this.lat,
      long: this.long,
      timezone: this.timezone,
      hijriDateOffset: this.hijriDateOffset,
      listId: this.listId,
    });
  }

  static fromTaskItem(t: Task) {
    let a = new PouchDBTaskDocument(t);
    a._id = t.id;
    a._rev = t.rev;
    a.noDate = !!t.atDateHijri ? 0 : 1;
    a.lat = t.lat;
    a.long = t.long;
    a.hijriDateOffset = t.hijriDateOffset;

    if (!!t.atDateHijri) {
      const { year, month, day } = parseHijriDateString(t.atDateHijri);
      let hour = undefined;
      let minute = undefined;
      // if no time defined set the epoch to the end of day
      let d = new HijriDate(year, month, day, hour, minute, 0, 0, {
        latitude: t.lat,
        longitude: t.long,
        offset: t.hijriDateOffset || 0,
      });

      a.atEpochMillis = d.endOfDay().toDate().valueOf();
      if (!!t.prayerTime) {
        a.prayerTime = t.prayerTime;
        a.usePrayerTime = true;
        a.atTime = "";
      }

      if (!!t.atTime) {
        const timeParts = parseTimeString(t.atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
        let d = new HijriDate(year, month, day, hour, minute, 0, 0, {
          latitude: t.lat,
          longitude: t.long,
          offset: t.hijriDateOffset || 0,
        }).toDate();

        a.atEpochMillis = d.valueOf();
        a.atTime = t.atTime;
        a.prayerTime = undefined;
        a.usePrayerTime = false;
      }
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

    const newTask = new Task({
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      atDateHijri: input.atDateHijri || "",
      atTime: input.atTime || "",
      createdAt: now,
      updatedAt: now,
      attributes: input.attributes || {},
      prayerTime: input.prayerTime,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset || 0,
      listId: input.listId,
    });

    const doc = PouchDBTaskDocument.fromTaskItem(newTask);
    delete doc._rev;

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
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined),
      ),
    );

    if (!!input.atTime) {
      updateData.atTime = input.atTime;
      updateData.usePrayerTime = false;
      updateData.prayerTime = undefined;
    } else if (!!input.prayerTime) {
      updateData.prayerTime = input.prayerTime;
      updateData.usePrayerTime = true;
      updateData.atTime = "";
    } else if (input.removeTime) {
      updateData.prayerTime = undefined;
      updateData.usePrayerTime = false;
      updateData.atTime = "";
    }

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
        fields: ["type", "status", "noDate", "atDateHijri", "atEpochMillis"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: 0,
        noDate: { $gte: 0 },
        atEpochMillis: {
          $gte: null,
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { noDate: "asc" },
        { atDateHijri: "asc" },
        { atEpochMillis: "asc" },
      ],
    };

    if (query?.status) {
      mangoQuery.selector.status = query.status;
    }

    if (query?.listId) {
      mangoQuery.selector.listId = query.listId;
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
      name: doc.name,
      status: doc.status,
      atEpochMillis: doc.atEpochMillis,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      atDateHijri: doc.atDateHijri,
    }));
  }

  // Find tasks scheduled before a specific Hijri date
  // Includes: Not-completed tasks with dates before the specified date
  async findTasksBefore(beforeHijri: HijriDate): Promise<Task[]> {
    await db.createIndex({
      index: {
        fields: ["type", "status", "noDate", "atDateHijri", "atEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        noDate: 0,
        atDateHijri: {
          $gt: null,
        },
        atEpochMillis: {
          $lte: beforeHijri.toDate().valueOf(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { noDate: "asc" },
        { atDateHijri: "asc" },
        { atEpochMillis: "asc" },
      ],
    };

    const result = await (db as any).find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findTodayCompletedTasks(todayHijri: HijriDate): Promise<Task[]> {
    await db.createIndex({
      index: {
        fields: ["type", "status", "completedAt"],
      },
    });

    const todayStart = todayHijri.startOfDay().toDate();
    const todayEnd = todayHijri.next().startOfDay().toDate();
    const mangoQuery = {
      selector: {
        type: "task",
        status: 1, // completed status
        completedAt: {
          $gte: todayStart.getTime(),
          $lte: todayEnd.getTime(),
        },
      },
      sort: [{ type: "asc" }, { status: "asc" }, { completedAt: "desc" }],
    };

    const result = await (db as any).find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async completeTask(id: string): Promise<Task> {
    const existingDoc = await (db as any).get(id);
    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      status: 1, // completed status
      completedAt: Date.now(), // set completion timestamp
      updatedAt: Date.now(),
    }).toTaskItem();

    const ud = PouchDBTaskDocument.fromTaskItem(updateData);
    const response = await (db as any).put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
  }

  async reopenTask(id: string): Promise<Task> {
    const existingDoc = await (db as any).get(id);
    const updateData = new PouchDBTaskDocument({
      ...existingDoc,
      status: 0, // pending status
      completedAt: undefined, // clear completion timestamp
      updatedAt: Date.now(),
    }).toTaskItem();

    const ud = PouchDBTaskDocument.fromTaskItem(updateData);
    const response = await (db as any).put(ud);
    const updatedDoc = new PouchDBTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTaskItem();
  }

  async findTasksAfter(todayHijri: HijriDate): Promise<Task[]> {
    await db.createIndex({
      index: {
        fields: ["type", "status", "noDate", "atEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: 0,
        noDate: 0,
        atEpochMillis: {
          $gte: todayHijri.toDate().valueOf(),
        },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { noDate: 0 },
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
        fields: ["type", "status", "noDate", "atEpochMillis"],
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
        noDate: { $gte: 0 },
        atEpochMillis: { $gte: null },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { noDate: "asc" },
        { atEpochMillis: "asc" },
      ],
      limit,
      skip: offset,
    };
    // Apply custom filters if provided
    if (query) {
      if (query.status !== undefined) {
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

      if (query.unscheduled !== undefined) {
        mangoQuery.selector.noDate = query.unscheduled;
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
