import PouchDB from "pouchdb";
import { HijriDate } from "../../modules/calendar/hijri";
import type {
  TaskCreateInput,
  TaskQuery,
  TaskStatus,
  TaskUpdateInput,
  PrayerTime,
  ListCreateInput,
  ListUpdateInput,
  ListQuery,
} from "../../modules/task/types";
import { Task, List } from "../../modules/task/types";
import { generatePrefixedUUID } from "../../lib/uuid";
import {
  parseHijriDateString,
  parseTimeString,
} from "../../modules/task/task-form-helpers";
import type {
  ITaskRepository,
  IListRepository,
} from "../../domain/task/ITaskRepository";

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

class PouchDBListDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "list" = "list";
  name?: string;
  description?: string;
  color?: string;
  createdAt: number = new Date().valueOf();
  updatedAt: number = new Date().valueOf();

  constructor(o: any) {
    Object.assign(this, o);
  }

  toListItem(): List {
    return new List({
      id: this._id || "",
      rev: this._rev,
      name: this.name || "",
      description: this.description || "",
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  static fromListItem(l: List) {
    let a = new PouchDBListDocument(l);
    a._id = l.id;
    a._rev = l.rev;
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

    await this.db.remove(doc as any);
  }

  async findById(id: string): Promise<Task | null> {
    try {
      const doc: PouchDBTaskDocument = await this.db.get(id);
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

    const result = await this.db.find(mangoQuery);

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
      sort: [{ atEpochMillis: "asc" as const }],
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findByHijriDate(hijriDate: string): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "hijriDate"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        hijriDate: hijriDate,
      },
      sort: [{ type: "asc" }, { hijriDate: "desc" }] as any,
    };

    const result = await this.db.find(mangoQuery);

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
      atDateHijri: doc.atDateHijri,
    }));
  }

  async findTasksBefore(beforeHijri: HijriDate): Promise<Task[]> {
    await this.db.createIndex({
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
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findTodayCompletedTasks(todayHijri: HijriDate): Promise<Task[]> {
    await this.db.createIndex({
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
      sort: [
        { type: "asc" },
        { status: "asc" },
        { completedAt: "desc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
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

  async findTasksAfter(todayHijri: HijriDate): Promise<Task[]> {
    await this.db.createIndex({
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
        { noDate: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findBrowsedTasks(
    query?: any,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "noDate", "atEpochMillis"],
      },
    });

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

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findInboxTasks(): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "noDate", "listId", "status", "createdAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        noDate: 1, // No schedule
        listId: { $eq: null }, // No listId (null or undefined)
        status: 0, // Not completed
        createdAt: { $gte: null },
      },
      sort: [
        { type: "asc" },
        { noDate: "asc" },
        { listId: "asc" },
        { status: "asc" },
        { createdAt: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }

  async findTasksByListId(
    listId: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "listId", "atEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: { $gte: 0 }, // Include all statuses (0=pending, 1=completed)
        listId: listId,
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { listId: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
      limit,
      skip: offset,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem(),
    );
  }
}

export class PouchDBListRepository implements IListRepository {
  constructor(private readonly db: PouchDB.Database) {}

  async create(input: ListCreateInput): Promise<List> {
    const now = Date.now().valueOf();

    const newList = new List({
      id: generatePrefixedUUID("list_"),
      name: input.name,
      description: input.description,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    });

    const doc = PouchDBListDocument.fromListItem(newList);
    delete doc._rev;

    await this.db.put(doc);

    return newList;
  }

  async update(id: string, input: ListUpdateInput): Promise<List> {
    const existingDoc = await this.db.get(id);
    const updateData = new PouchDBListDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toListItem();

    // Check if fields are inputted / undefined
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined),
      ),
    );

    const ud = PouchDBListDocument.fromListItem(updateData);
    const response = await this.db.put(ud);
    const updatedDoc = new PouchDBListDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toListItem();
  }

  async delete(id: string): Promise<void> {
    const doc: PouchDBListDocument = await this.db.get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    await this.db.remove(doc as any);
  }

  async findById(id: string): Promise<List | null> {
    try {
      const doc: PouchDBListDocument = await this.db.get(id);
      return new PouchDBListDocument(doc).toListItem();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: ListQuery): Promise<List[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "name"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "list",
      },
      sort: [{ type: "asc" }, { name: "asc" }],
    };

    if (query?.searchText && query.searchText.trim()) {
      const searchLower = query.searchText.toLowerCase().trim();
      mangoQuery.selector.$or = [
        { name: { $regex: searchLower } },
        { description: { $regex: searchLower } },
      ];
    }

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBListDocument) =>
      new PouchDBListDocument(doc).toListItem(),
    );
  }

  async findWithPagination(
    offset: number,
    limit: number = 20,
  ): Promise<List[]> {
    const mangoQuery = {
      selector: {
        type: "list",
      },
      sort: [{ _id: "asc" as const }],
      limit,
      skip: offset,
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBListDocument) =>
      new PouchDBListDocument(doc).toListItem(),
    );
  }
}
