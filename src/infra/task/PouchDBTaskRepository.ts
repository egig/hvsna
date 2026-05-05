import PouchDB from "pouchdb";
import { Capacitor } from "@capacitor/core";
import { HijriDate } from "../../modules/calendar/hijri";
import type {
  TaskCreateInput,
  TaskQuery,
  TaskRepeat,
  TaskStatus,
  TaskUpdateInput,
  PrayerTime,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectQuery,
} from "../../modules/task/types";
import { Task, Project } from "../../modules/task/types";
import { generatePrefixedUUID } from "../../modules/uuid";
import {
  parseHijriDateString,
  parseTimeString,
} from "../../modules/task/task-form-helpers";
import type {
  ITaskRepository,
  IProjectRepository,
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
  repeat?: TaskRepeat;
  repeatInterval?: number;
  recurringTaskId?: string;
  projectId?: string | null = null;
  tags?: string[] | null = null;

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
      repeat: this.repeat,
      repeatInterval: this.repeatInterval,
      recurringTaskId: this.recurringTaskId,
      projectId: this.projectId,
      tags: this.tags,
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
    a.projectId = t.projectId || null;
    a.tags = t.tags || [];

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

class PouchDBProjectDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "project" = "project";
  name?: string;
  description?: string;
  color?: string;
  createdAt: number = new Date().valueOf();
  updatedAt: number = new Date().valueOf();

  constructor(o: any) {
    Object.assign(this, o);
  }

  toProjectItem(): Project {
    return new Project({
      id: this._id || "",
      rev: this._rev,
      name: this.name || "",
      description: this.description || "",
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  static fromProjectItem(l: Project) {
    let a = new PouchDBProjectDocument(l);
    a._id = l.id;
    a._rev = l.rev;
    return a;
  }
}

export class PouchDBTaskRepository implements ITaskRepository {
  private readonly db: PouchDB.Database;

  constructor(dbOrName?: PouchDB.Database | string) {
    if (dbOrName instanceof PouchDB) {
      // Use provided database instance
      this.db = dbOrName;
    } else {
      // Create database with appropriate adapter
      this.db = PouchDBTaskRepository.createDatabase(dbOrName);
    }
  }

  static createWebDatabase(dbName = "hvsna-tasks"): PouchDB.Database {
    return new PouchDB(dbName);
  }

  static createNativeDatabase(dbName = "hvsna-tasks"): PouchDB.Database {
    try {
      PouchDB.plugin(require("pouchdb-adapter-cordova-sqlite"));
      return new PouchDB(dbName, { adapter: "cordova-sqlite" });
    } catch (error) {
      console.warn(
        "Failed to load SQLite adapter, falling back to IndexedDB:",
        error
      );
      return new PouchDB(dbName);
    }
  }

  /**
   * Factory method to create a PouchDB instance with the appropriate adapter
   * based on the current platform. Prefer createWebDatabase/createNativeDatabase
   * in platform-specific entry points.
   */
  static createDatabase(dbName?: string): PouchDB.Database {
    const databaseName = dbName || "hvsna-tasks";
    return Capacitor.isNativePlatform()
      ? this.createNativeDatabase(databaseName)
      : this.createWebDatabase(databaseName);
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
      repeat: input.repeat,
      repeatInterval: input.repeatInterval,
      recurringTaskId: input.recurringTaskId,
      projectId: input.projectId,
      tags: input.tags,
    });

    const doc = PouchDBTaskDocument.fromTaskItem(newTask);
    delete doc._rev;

    console.log("create task with", doc);
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

    if (query?.projectId) {
      mangoQuery.selector.projectId = query.projectId;
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
      new PouchDBTaskDocument(doc).toTaskItem()
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
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findWithPagination(
    offset: number,
    limit: number = 20
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
      new PouchDBTaskDocument(doc).toTaskItem()
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
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findBrowsedTasks(
    query?: any,
    offset: number = 0,
    limit: number = 50
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: [
          "type",
          "status",
          "projectId",
          "noDate",
          "atEpochMillis",
          "tags",
        ],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "task",
        status: { $gte: 0 },
        projectId: { $gte: null },
        noDate: { $gte: 0 },
        atEpochMillis: { $gte: null },
        tags: { $gte: null },
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { projectId: "asc" },
        { noDate: "asc" },
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
        mangoQuery.selector.atEpochMillis = query.atEpochMillis;
      }
      if (query.searchText && query.searchText.trim()) {
        const searchLower = query.searchText.toLowerCase().trim();
        mangoQuery.selector.$or = [
          { name: { $regex: searchLower } },
          { description: { $regex: searchLower } },
        ];
      }
      if (query.unscheduled !== undefined) {
        mangoQuery.selector.noDate = query.unscheduled;
      }
      if (query.projectId) {
        mangoQuery.selector.projectId = query.projectId;
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
        fields: ["type", "noDate", "status", "createdAt"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        noDate: 1, // No schedule
        status: 0, // Not completed
        createdAt: { $gte: null },
      },
      sort: [
        { type: "asc" },
        { noDate: "asc" },
        { status: "asc" },
        { createdAt: "asc" },
      ] as any,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findTasksByProjectId(
    projectId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<Task[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "status", "projectId", "atEpochMillis"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        status: { $gte: 0 }, // Include all statuses (0=pending, 1=completed)
        projectId: projectId,
      },
      sort: [
        { type: "asc" },
        { status: "asc" },
        { projectId: "asc" },
        { atEpochMillis: "asc" },
      ] as any,
      limit,
      skip: offset,
    };

    const result = await this.db.find(mangoQuery);
    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async findByRecurringTaskId(recurringTaskId: string): Promise<Task[]> {
    await this.db.createIndex({
      index: { fields: ["type", "recurringTaskId"] },
    });

    const result = await this.db.find({
      selector: {
        type: "task",
        recurringTaskId,
      },
    });

    return (result as any).docs.map((doc: PouchDBTaskDocument) =>
      new PouchDBTaskDocument(doc).toTaskItem()
    );
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string): Promise<void> {
    const tasks = await this.findByRecurringTaskId(recurringTaskId);
    const pending = tasks.filter((t) => t.status !== 1);
    await Promise.all(pending.map((t) => this.delete(t.id!)));
  }
}

export class PouchDBProjectRepository implements IProjectRepository {
  private readonly db: PouchDB.Database;

  constructor(dbOrName?: PouchDB.Database | string) {
    if (dbOrName instanceof PouchDB) {
      // Use provided database instance
      this.db = dbOrName;
    } else {
      // Create database with appropriate adapter
      this.db = PouchDBTaskRepository.createDatabase(dbOrName);
    }
  }

  async create(input: ProjectCreateInput): Promise<Project> {
    const now = Date.now().valueOf();

    const newProject = new Project({
      id: generatePrefixedUUID("project_"),
      name: input.name,
      description: input.description,
      color: input.color,
      createdAt: now,
      updatedAt: now,
    });

    const doc = PouchDBProjectDocument.fromProjectItem(newProject);
    delete doc._rev;

    await this.db.put(doc);

    return newProject;
  }

  async update(id: string, input: ProjectUpdateInput): Promise<Project> {
    const existingDoc = await this.db.get(id);
    const updateData = new PouchDBProjectDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toProjectItem();

    // Check if fields are inputted / undefined
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined)
      )
    );

    const ud = PouchDBProjectDocument.fromProjectItem(updateData);
    const response = await this.db.put(ud);
    const updatedDoc = new PouchDBProjectDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toProjectItem();
  }

  async delete(id: string): Promise<void> {
    const doc: PouchDBProjectDocument = await this.db.get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    await this.db.remove(doc as any);
  }

  async findById(id: string): Promise<Project | null> {
    try {
      const doc: PouchDBProjectDocument = await this.db.get(id);
      return new PouchDBProjectDocument(doc).toProjectItem();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: ProjectQuery): Promise<Project[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "name"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "project",
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

    return (result as any).docs.map((doc: PouchDBProjectDocument) =>
      new PouchDBProjectDocument(doc).toProjectItem()
    );
  }

  async findWithPagination(
    offset: number,
    limit: number = 20
  ): Promise<Project[]> {
    const mangoQuery = {
      selector: {
        type: "project",
      },
      sort: [{ _id: "asc" as const }],
      limit,
      skip: offset,
    };

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBProjectDocument) =>
      new PouchDBProjectDocument(doc).toProjectItem()
    );
  }
}
