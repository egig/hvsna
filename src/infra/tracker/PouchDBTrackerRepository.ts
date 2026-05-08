import PouchDB from "pouchdb";
import type {
  Tracker,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerQuery,
} from "../../domain/tracker/Tracker";
import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import { generatePrefixedUUID } from "../../modules/uuid";

export class PouchDBTrackerRepository implements ITrackerRepository {
  private readonly db: PouchDB.Database;

  constructor(dbOrName?: PouchDB.Database | string) {
    if (dbOrName instanceof PouchDB) {
      this.db = dbOrName;
    } else {
      this.db = PouchDBTrackerRepository.createDatabase(dbOrName);
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

  async create(input: TrackerCreateInput): Promise<Tracker> {
    const now = Date.now();

    const tracker: Tracker = {
      id: input.id || `trac_${crypto.randomUUID()}`,
      name: input.name,
      description: input.description,
      attributes: input.attributes,
      inputMode: input.inputMode,
      unit: input.unit,
      goals: input.goals,
      created_at: now,
      updated_at: now,
    };

    const response = await this.db.put({
      _id: tracker.id,
      ...tracker,
    });

    return {
      ...tracker,
      _rev: response.rev,
    } as unknown as Tracker;
  }

  async update(id: string, input: TrackerUpdateInput): Promise<Tracker> {
    const existingDoc = await this.db.get(id);
    const updateData = {
      ...existingDoc,
      ...input,
      updated_at: Date.now(),
    };

    const response = await this.db.put(updateData);
    const updatedDoc = {
      ...updateData,
      _rev: response.rev,
    };

    return updatedDoc as unknown as Tracker;
  }

  async delete(id: string): Promise<void> {
    const doc = await this.db.get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    await this.db.remove(doc as any);
  }

  async findById(id: string): Promise<Tracker | null> {
    try {
      const doc = await this.db.get(id);
      return doc as unknown as Tracker;
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: TrackerQuery): Promise<Tracker[]> {
    if (query?.id) {
      const doc = await this.findById(query.id);
      return doc ? [doc] : [];
    }

    const result = await this.db.allDocs({
      include_docs: true,
      startkey: "trac_",
      endkey: "trac_\uffff",
    });

    return result.rows
      .filter((row: any) => row.doc)
      .map((row: any) => row.doc as unknown as Tracker);
  }

  async findTrackers(): Promise<Tracker[]> {
    return this.find();
  }
}
