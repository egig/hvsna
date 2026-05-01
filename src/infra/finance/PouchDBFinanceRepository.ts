import PouchDB from "pouchdb";
import { Capacitor } from "@capacitor/core";
import { generatePrefixedUUID } from "../../modules/uuid";
import type {
  IFinanceRepository,
  FinanceEntryCreateInput,
  FinanceEntryUpdateInput,
  FinanceQuery,
} from "../../domain/finance/IFinanceRepository";
import { FinanceEntry } from "../../domain/finance/IFinanceRepository";

class PouchDBFinanceDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "finance_entry" = "finance_entry";
  entryType?: "income" | "expense";
  amount?: number;
  description?: string;
  category?: string;
  dateHijri?: string;
  note?: string;
  createdAt: number = Date.now();
  updatedAt: number = Date.now();

  constructor(o: any) {
    Object.assign(this, o);
  }

  toFinanceEntry(): FinanceEntry {
    const entry = new FinanceEntry();
    entry.id = this._id;
    entry.type = this.entryType;
    entry.amount = this.amount;
    entry.description = this.description;
    entry.category = this.category;
    entry.dateHijri = this.dateHijri;
    entry.note = this.note;
    entry.createdAt = this.createdAt;
    entry.updatedAt = this.updatedAt;
    return entry;
  }

  static fromFinanceEntry(e: FinanceEntry): PouchDBFinanceDocument {
    const doc = new PouchDBFinanceDocument({
      _id: e.id,
      _rev: undefined,
      entryType: e.type,
      amount: e.amount,
      description: e.description,
      category: e.category,
      dateHijri: e.dateHijri,
      note: e.note,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
    return doc;
  }
}

export class PouchDBFinanceRepository implements IFinanceRepository {
  private readonly db: PouchDB.Database;

  constructor(db: PouchDB.Database) {
    this.db = db;
  }

  static createWebDatabase(dbName = "hvsna-finance"): PouchDB.Database {
    return new PouchDB(dbName);
  }

  static createNativeDatabase(dbName = "hvsna-finance"): PouchDB.Database {
    try {
      PouchDB.plugin(require("pouchdb-adapter-cordova-sqlite"));
      return new PouchDB(dbName, { adapter: "cordova-sqlite" });
    } catch (error) {
      console.warn("Failed to load SQLite adapter, falling back to IndexedDB:", error);
      return new PouchDB(dbName);
    }
  }

  static createDatabase(dbName?: string): PouchDB.Database {
    const name = dbName ?? "hvsna-finance";
    return Capacitor.isNativePlatform()
      ? this.createNativeDatabase(name)
      : this.createWebDatabase(name);
  }

  async create(input: FinanceEntryCreateInput): Promise<FinanceEntry> {
    const now = Date.now();
    const entry = new FinanceEntry();
    entry.id = generatePrefixedUUID("finance_");
    entry.type = input.type;
    entry.amount = input.amount;
    entry.description = input.description;
    entry.category = input.category;
    entry.dateHijri = input.dateHijri;
    entry.note = input.note;
    entry.createdAt = now;
    entry.updatedAt = now;

    const doc = PouchDBFinanceDocument.fromFinanceEntry(entry);
    delete (doc as any)._rev;
    await this.db.put(doc);
    return entry;
  }

  async update(id: string, input: FinanceEntryUpdateInput): Promise<FinanceEntry> {
    const existingDoc: any = await this.db.get(id);
    const existing = new PouchDBFinanceDocument(existingDoc).toFinanceEntry();

    Object.assign(
      existing,
      Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))
    );
    existing.updatedAt = Date.now();

    const doc = PouchDBFinanceDocument.fromFinanceEntry(existing);
    doc._rev = existingDoc._rev;

    await this.db.put(doc);
    existing.id = id;
    return existing;
  }

  async delete(id: string): Promise<void> {
    const doc: any = await this.db.get(id);
    if (!doc._rev) throw new Error("Document revision is required for deletion");
    await this.db.remove(doc);
  }

  async findById(id: string): Promise<FinanceEntry | null> {
    try {
      const doc: any = await this.db.get(id);
      return new PouchDBFinanceDocument(doc).toFinanceEntry();
    } catch (err) {
      if ((err as any).status === 404) return null;
      throw err;
    }
  }

  async find(query?: FinanceQuery): Promise<FinanceEntry[]> {
    await this.db.createIndex({
      index: { fields: ["type", "createdAt"] },
    });

    const selector: any = {
      type: "finance_entry",
      createdAt: { $gte: null },
    };

    if (query?.type) {
      selector.entryType = query.type;
    }

    if (query?.dateHijri) {
      selector.dateHijri = query.dateHijri;
    }

    if (query?.category) {
      selector.category = query.category;
    }

    if (query?.searchText?.trim()) {
      const searchLower = query.searchText.toLowerCase().trim();
      selector.$or = [
        { description: { $regex: searchLower } },
        { note: { $regex: searchLower } },
      ];
    }

    const result = await this.db.find({
      selector,
      sort: [{ type: "asc" }, { createdAt: "asc" }],
    });

    return (result as any).docs.map((doc: any) =>
      new PouchDBFinanceDocument(doc).toFinanceEntry()
    );
  }
}
