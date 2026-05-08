import PouchDB from "pouchdb";
import type {
  TrackerLog,
  TrackerLogCreateInput,
  TrackerLogUpdateInput,
  TrackerLogQuery,
} from "../../domain/tracker/TrackerLog";
import type { ITrackerLogRepository } from "../../domain/tracker/ITrackerLogRepository";

class PouchDBTrackerLogDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "tlog" = "tlog";
  trackerId?: string;
  value?: number;
  note?: string;
  occurredAt?: number;
  createdAt?: number;
  updatedAt?: number;

  constructor(o: any) {
    Object.assign(this, o);
  }

  toTrackerLog(): TrackerLog {
    return {
      id: this._id || "",
      trackerId: this.trackerId || "",
      value: this.value || 0,
      note: this.note,
      occurredAt: this.occurredAt || 0,
      createdAt: this.createdAt || 0,
      updatedAt: this.updatedAt || 0,
    };
  }

  static fromTrackerLog(t: TrackerLog): PouchDBTrackerLogDocument {
    const doc = new PouchDBTrackerLogDocument(t);
    doc._id = t.id;
    doc._rev = (t as any)._rev;
    doc.trackerId = t.trackerId;
    doc.value = t.value;
    doc.note = t.note;
    doc.occurredAt = t.occurredAt;
    doc.createdAt = t.createdAt;
    doc.updatedAt = t.updatedAt;
    return doc;
  }
}

export class PouchDBTrackerLogRepository implements ITrackerLogRepository {
  private readonly db: PouchDB.Database;

  constructor(dbOrName?: PouchDB.Database | string) {
    if (dbOrName instanceof PouchDB) {
      this.db = dbOrName;
    } else {
      this.db = PouchDBTrackerLogRepository.createDatabase(dbOrName);
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

  static createDatabase(dbName?: string): PouchDB.Database {
    const { Capacitor } = require("@capacitor/core");
    const databaseName = dbName || "hvsna-tasks";
    return Capacitor.isNativePlatform()
      ? this.createNativeDatabase(databaseName)
      : this.createWebDatabase(databaseName);
  }

  async create(input: TrackerLogCreateInput): Promise<TrackerLog> {
    const now = Date.now();
    const id = `tlog_${input.trackerId}_${crypto.randomUUID()}`;

    const trackerLog: TrackerLog = {
      id,
      trackerId: input.trackerId,
      value: input.value,
      note: input.note,
      occurredAt: input.occurredAt || now,
      createdAt: now,
      updatedAt: now,
    };

    const doc = PouchDBTrackerLogDocument.fromTrackerLog(trackerLog);
    delete doc._rev;

    const response = await this.db.put(doc);

    return {
      ...trackerLog,
      _rev: response.rev,
    } as unknown as TrackerLog;
  }

  async update(id: string, input: TrackerLogUpdateInput): Promise<TrackerLog> {
    const existingDoc = await this.db.get(id);
    const existingLog = new PouchDBTrackerLogDocument(
      existingDoc
    ).toTrackerLog();

    const updateData: TrackerLog = {
      ...existingLog,
      ...input,
      updatedAt: Date.now(),
    };

    const doc = PouchDBTrackerLogDocument.fromTrackerLog(updateData);
    const response = await this.db.put(doc);

    const updatedDoc = new PouchDBTrackerLogDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toTrackerLog();
  }

  async delete(id: string): Promise<void> {
    const doc: PouchDBTrackerLogDocument = await this.db.get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    await this.db.remove(doc as any);
  }

  async findById(id: string): Promise<TrackerLog | null> {
    try {
      const doc: PouchDBTrackerLogDocument = await this.db.get(id);
      return new PouchDBTrackerLogDocument(doc).toTrackerLog();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: TrackerLogQuery): Promise<TrackerLog[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "trackerId", "occurredAt"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "tlog",
      },
      sort: [
        {
          type: "desc",
          trackerId: "desc",
          occurredAt: "desc",
        },
      ],
    };

    if (query?.trackerId) {
      mangoQuery.selector.trackerId = query.trackerId;
    }

    if (query?.startTime !== undefined) {
      mangoQuery.selector.occurredAt = {
        ...(mangoQuery.selector.occurredAt || {}),
        $gte: query.startTime,
      };
    }

    if (query?.endTime !== undefined) {
      mangoQuery.selector.occurredAt = {
        ...(mangoQuery.selector.occurredAt || {}),
        $lte: query.endTime,
      };
    }

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBTrackerLogDocument) =>
      new PouchDBTrackerLogDocument(doc).toTrackerLog()
    );
  }

  async findByTrackerId(trackerId: string): Promise<TrackerLog[]> {
    return this.find({ trackerId });
  }

  async findByTimestampRange(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<TrackerLog[]> {
    return this.find({ trackerId, startTime, endTime });
  }

  async getLatestLog(trackerId: string): Promise<TrackerLog | null> {
    console.log(
      "call getLatestLog",
      trackerId,
      await this.db.allDocs({ include_docs: true })
    );
    const logs = await this.find({ trackerId });
    return logs.length > 0 ? logs[0] : null;
  }

  async getLogCount(trackerId: string): Promise<number> {
    const logs = await this.findByTrackerId(trackerId);
    return logs.length;
  }

  async getSumByPeriod(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<number> {
    const logs = await this.findByTimestampRange(trackerId, startTime, endTime);
    return logs.reduce((sum, log) => sum + log.value, 0);
  }

  async getAverageByPeriod(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<number> {
    const logs = await this.findByTimestampRange(trackerId, startTime, endTime);
    if (logs.length === 0) return 0;
    const sum = logs.reduce((sum, log) => sum + log.value, 0);
    return sum / logs.length;
  }
}
