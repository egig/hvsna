import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";

class PouchDBRecurringTaskDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "rtask" = "rtask";
  id?: string;
  user_id?: string;
  name?: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat?: string;
  repeatInterval?: number;
  baseDateHijri?: string;
  atTime?: string;
  prayerTime?: any;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[] | null = null;
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  created_at?: number;
  updated_at?: number;

  constructor(o: any) {
    Object.assign(this, o);
  }

  toRecurringTask(): RecurringTask {
    return {
      id: this._id || this.id || "",
      user_id: this.user_id,
      name: this.name || "",
      description: this.description,
      attributes: this.attributes,
      repeat: this.repeat as any,
      repeatInterval: this.repeatInterval || 1,
      baseDateHijri: this.baseDateHijri || "",
      atTime: this.atTime,
      prayerTime: this.prayerTime,
      lat: this.lat,
      long: this.long,
      timezone: this.timezone,
      hijriDateOffset: this.hijriDateOffset,
      tags: this.tags || undefined,
      repeatEnd: this.repeatEnd,
      repeatEndDate: this.repeatEndDate,
      repeatEndOccurrences: this.repeatEndOccurrences,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  static fromRecurringTask(t: RecurringTask): PouchDBRecurringTaskDocument {
    const doc = new PouchDBRecurringTaskDocument(t);
    doc._id = t.id;
    doc._rev = (t as any)._rev;
    doc.id = t.id;
    doc.user_id = t.user_id;
    doc.name = t.name;
    doc.description = t.description;
    doc.attributes = t.attributes;
    doc.repeat = t.repeat;
    doc.repeatInterval = t.repeatInterval;
    doc.baseDateHijri = t.baseDateHijri;
    doc.atTime = t.atTime;
    doc.prayerTime = t.prayerTime;
    doc.lat = t.lat;
    doc.long = t.long;
    doc.timezone = t.timezone;
    doc.hijriDateOffset = t.hijriDateOffset;
    doc.tags = t.tags;
    doc.repeatEnd = t.repeatEnd;
    doc.repeatEndDate = t.repeatEndDate;
    doc.repeatEndOccurrences = t.repeatEndOccurrences;
    doc.created_at = t.created_at;
    doc.updated_at = t.updated_at;
    return doc;
  }
}

export class PouchDBRecurringTaskRepository
  implements IRecurringTaskRepository
{
  constructor(private readonly db: PouchDB.Database) {}

  async create(input: RecurringTaskCreateInput): Promise<RecurringTask> {
    const now = Date.now();
    const id = input.id || `rtask_${crypto.randomUUID()}`;

    const recurringTask: RecurringTask = {
      id,
      name: input.name,
      description: input.description,
      attributes: input.attributes,
      repeat: input.repeat,
      repeatInterval: input.repeatInterval ?? 1,
      baseDateHijri: input.baseDateHijri,
      atTime: input.atTime,
      prayerTime: input.prayerTime,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset,
      created_at: now,
      updated_at: now,
      repeatEnd: input.repeatEnd,
      repeatEndDate: input.repeatEndDate,
      repeatEndOccurrences: input.repeatEndOccurrences,
      tags: input.tags,
    };

    const doc = PouchDBRecurringTaskDocument.fromRecurringTask(recurringTask);
    delete doc._rev;

    const response = await this.db.put(doc);

    return recurringTask;
  }

  async update(
    id: string,
    input: RecurringTaskUpdateInput
  ): Promise<RecurringTask> {
    const existingDoc = await this.db.get(id);
    const existingTask = new PouchDBRecurringTaskDocument(
      existingDoc
    ).toRecurringTask();

    const updateData: RecurringTask = {
      ...existingTask,
      ...input,
      updated_at: Date.now(),
      tags: input.tags ?? undefined,
    };

    const doc = PouchDBRecurringTaskDocument.fromRecurringTask(updateData);
    const response = await this.db.put(doc);

    const updatedDoc = new PouchDBRecurringTaskDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toRecurringTask();
  }

  async delete(id: string): Promise<void> {
    const doc = await this.db.get(id);
    await this.db.remove(doc);
  }

  async findById(id: string): Promise<RecurringTask | null> {
    try {
      const doc = await this.db.get(id);
      return new PouchDBRecurringTaskDocument(doc).toRecurringTask();
    } catch (err: any) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: RecurringTaskQuery): Promise<RecurringTask[]> {
    await this.db.createIndex({
      index: {
        fields: ["type", "repeat"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "rtask",
      },
      sort: [
        {
          type: "asc",
          repeat: "asc",
        },
      ],
    };

    if (query?.repeat) {
      mangoQuery.selector.repeat = query.repeat;
    }

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: any) =>
      new PouchDBRecurringTaskDocument(doc).toRecurringTask()
    );
  }
}
