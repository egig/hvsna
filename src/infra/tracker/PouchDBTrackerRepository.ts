import PouchDB from "pouchdb";
import { Capacitor } from "@capacitor/core";
import { generatePrefixedUUID } from "../../modules/uuid";
import type {
  ITrackerRepository,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerLogCreateInput,
  TrackerLogUpdateInput,
  TrackerQuery,
} from "../../domain/tracker/ITrackerRepository";
import { Tracker, TrackerLog } from "../../domain/tracker/ITrackerRepository";

class PouchDBTrackerDocument {
  _id?: string;
  _rev?: string;
  type: "tracker" = "tracker";
  name?: string;
  trackerType?: string;
  unit?: string;
  color?: string;
  emoji?: string;
  createdAt: number = Date.now();
  updatedAt: number = Date.now();

  // goal fields
  period?: string;
  condition?: string;
  startingValue?: number;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  startDateHijri?: string;
  endDateHijri?: string;

  constructor(o: any) {
    Object.assign(this, o);
  }

  toTracker(): Tracker {
    const t = new Tracker();
    t.id = this._id;
    t.name = this.name;
    t.type = this.trackerType as any;
    t.unit = this.unit;
    t.color = this.color;
    t.emoji = this.emoji;
    t.createdAt = this.createdAt;
    t.updatedAt = this.updatedAt;
    t.period = this.period as any;
    t.condition = this.condition as any;
    t.startingValue = this.startingValue;
    t.targetValue = this.targetValue;
    t.targetMin = this.targetMin;
    t.targetMax = this.targetMax;
    t.startDateHijri = this.startDateHijri;
    t.endDateHijri = this.endDateHijri;
    return t;
  }
}

class PouchDBTrackerLogDocument {
  _id?: string;
  _rev?: string;
  type: "tracker_log" = "tracker_log";
  trackerId?: string;
  value?: number;
  valueBool?: boolean;
  valueMin?: number;
  valueMax?: number;
  note?: string;
  occurredAt?: number;
  createdAt: number = Date.now();

  constructor(o: any) {
    Object.assign(this, o);
  }

  toTrackerLog(): TrackerLog {
    const l = new TrackerLog();
    l.id = this._id;
    l.trackerId = this.trackerId;
    l.value = this.value;
    l.valueBool = this.valueBool;
    l.valueMin = this.valueMin;
    l.valueMax = this.valueMax;
    l.note = this.note;
    // fall back to createdAt for documents that pre-date this field
    l.occurredAt = this.occurredAt ?? this.createdAt;
    l.createdAt = this.createdAt;
    return l;
  }
}

export class PouchDBTrackerRepository implements ITrackerRepository {
  private readonly db: PouchDB.Database;

  constructor(db: PouchDB.Database) {
    this.db = db;
  }

  static createWebDatabase(dbName = "hvsna-tracker"): PouchDB.Database {
    return new PouchDB(dbName);
  }

  static createNativeDatabase(dbName = "hvsna-tracker"): PouchDB.Database {
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

  static createDatabase(dbName?: string): PouchDB.Database {
    const name = dbName ?? "hvsna-tracker";
    return Capacitor.isNativePlatform()
      ? this.createNativeDatabase(name)
      : this.createWebDatabase(name);
  }

  async createTracker(input: TrackerCreateInput): Promise<Tracker> {
    const now = Date.now();
    const doc = new PouchDBTrackerDocument({
      _id: generatePrefixedUUID("tracker_"),
      name: input.name,
      trackerType: input.type,
      unit: input.unit,
      color: input.color,
      emoji: input.emoji,
      period: input.period,
      condition: input.condition,
      startingValue: input.startingValue,
      targetValue: input.targetValue,
      targetMin: input.targetMin,
      targetMax: input.targetMax,
      startDateHijri: input.startDateHijri,
      endDateHijri: input.endDateHijri,
      createdAt: now,
      updatedAt: now,
    });
    delete (doc as any)._rev;
    await this.db.put(doc);
    return doc.toTracker();
  }

  async updateTracker(id: string, input: TrackerUpdateInput): Promise<Tracker> {
    const existingDoc: any = await this.db.get(id);
    const doc = new PouchDBTrackerDocument(existingDoc);
    if (input.name !== undefined) doc.name = input.name;
    if (input.type !== undefined) doc.trackerType = input.type;
    if (input.unit !== undefined) doc.unit = input.unit;
    if (input.color !== undefined) doc.color = input.color;
    if (input.emoji !== undefined) doc.emoji = input.emoji;
    if (input.period !== undefined) doc.period = input.period;
    if (input.condition !== undefined) doc.condition = input.condition;
    if (input.startingValue !== undefined)
      doc.startingValue = input.startingValue;
    if (input.targetValue !== undefined) doc.targetValue = input.targetValue;
    if (input.targetMin !== undefined) doc.targetMin = input.targetMin;
    if (input.targetMax !== undefined) doc.targetMax = input.targetMax;
    if (input.startDateHijri !== undefined)
      doc.startDateHijri = input.startDateHijri;
    if (input.endDateHijri !== undefined) doc.endDateHijri = input.endDateHijri;
    doc.updatedAt = Date.now();
    await this.db.put(doc);
    return doc.toTracker();
  }

  async deleteTracker(id: string): Promise<void> {
    const doc: any = await this.db.get(id);
    await this.db.remove(doc);
    const logs = await this.findLogs({ trackerId: id });
    for (const log of logs) {
      if (log.id) {
        try {
          const logDoc: any = await this.db.get(log.id);
          await this.db.remove(logDoc);
        } catch {
          // ignore
        }
      }
    }
  }

  async findTrackerById(id: string): Promise<Tracker | null> {
    try {
      const doc: any = await this.db.get(id);
      return new PouchDBTrackerDocument(doc).toTracker();
    } catch (err) {
      if ((err as any).status === 404) return null;
      throw err;
    }
  }

  async findTrackers(): Promise<Tracker[]> {
    await this.db.createIndex({ index: { fields: ["type", "createdAt"] } });
    const result = await this.db.find({
      selector: { type: "tracker", createdAt: { $gte: null } },
      sort: [{ type: "asc" }, { createdAt: "asc" }],
    });
    return (result as any).docs.map((doc: any) =>
      new PouchDBTrackerDocument(doc).toTracker()
    );
  }

  async createLog(input: TrackerLogCreateInput): Promise<TrackerLog> {
    const now = Date.now();
    const doc = new PouchDBTrackerLogDocument({
      _id: generatePrefixedUUID("tracker_log_"),
      trackerId: input.trackerId,
      value: input.value,
      valueBool: input.valueBool,
      valueMin: input.valueMin,
      valueMax: input.valueMax,
      note: input.note,
      occurredAt: input.occurredAt ?? now,
      createdAt: now,
    });
    delete (doc as any)._rev;
    await this.db.put(doc);
    return doc.toTrackerLog();
  }

  async updateLog(
    id: string,
    input: TrackerLogUpdateInput
  ): Promise<TrackerLog> {
    const existingDoc: any = await this.db.get(id);
    const doc = new PouchDBTrackerLogDocument(existingDoc);
    if (input.value !== undefined) doc.value = input.value;
    if (input.valueBool !== undefined) doc.valueBool = input.valueBool;
    if (input.valueMin !== undefined) doc.valueMin = input.valueMin;
    if (input.valueMax !== undefined) doc.valueMax = input.valueMax;
    if (input.note !== undefined) doc.note = input.note;
    if (input.occurredAt !== undefined) doc.occurredAt = input.occurredAt;
    await this.db.put(doc);
    return doc.toTrackerLog();
  }

  async deleteLog(id: string): Promise<void> {
    const doc: any = await this.db.get(id);
    await this.db.remove(doc);
  }

  async findLogs(query?: TrackerQuery): Promise<TrackerLog[]> {
    await this.db.createIndex({
      index: { fields: ["type", "trackerId", "createdAt"] },
    });
    const selector: any = {
      type: "tracker_log",
      createdAt: { $gte: null },
    };
    if (query?.trackerId) selector.trackerId = query.trackerId;

    const result = await this.db.find({
      selector,
      sort: [{ type: "desc" }, { createdAt: "desc" }],
    });
    return (result as any).docs.map((doc: any) =>
      new PouchDBTrackerLogDocument(doc).toTrackerLog()
    );
  }
}
