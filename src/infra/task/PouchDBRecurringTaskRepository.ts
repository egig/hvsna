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
  recurringType?: string;
  recurringInterval?: number;
  baseDateEpoch?: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[] | null = null;
  recurringEnd?: "never" | "on_date" | "after_occurrences";
  recurringEndEpoch?: number;
  recurringEndOccurrences?: number;
  useGregorian?: boolean;
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
      recurringType: this.recurringType as any,
      recurringInterval: this.recurringInterval || 1,
      baseDateEpoch: this.baseDateEpoch ?? 0,
      atTime: this.atTime,
      lat: this.lat,
      long: this.long,
      timezone: this.timezone,
      hijriDateOffset: this.hijriDateOffset,
      tags: this.tags || undefined,
      recurringEnd: this.recurringEnd,
      recurringEndEpoch: this.recurringEndEpoch,
      recurringEndOccurrences: this.recurringEndOccurrences,
      useGregorian: this.useGregorian,
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
    doc.recurringType = t.recurringType;
    doc.recurringInterval = t.recurringInterval;
    doc.baseDateEpoch = t.baseDateEpoch;
    doc.atTime = t.atTime;
    doc.lat = t.lat;
    doc.long = t.long;
    doc.timezone = t.timezone;
    doc.hijriDateOffset = t.hijriDateOffset;
    doc.tags = t.tags;
    doc.recurringEnd = t.recurringEnd;
    doc.recurringEndEpoch = t.recurringEndEpoch;
    doc.recurringEndOccurrences = t.recurringEndOccurrences;
    doc.useGregorian = t.useGregorian;
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
      recurringType: input.recurringType,
      recurringInterval: input.recurringInterval ?? 1,
      baseDateEpoch: input.baseDateEpoch,
      atTime: input.atTime,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset,
      created_at: now,
      updated_at: now,
      recurringEnd: input.recurringEnd,
      recurringEndEpoch: input.recurringEndEpoch,
      recurringEndOccurrences: input.recurringEndOccurrences,
      useGregorian: input.useGregorian,
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
        fields: ["type", "recurringType"],
      },
    });

    const mangoQuery: any = {
      selector: {
        type: "rtask",
      },
      sort: [
        {
          type: "asc",
          recurringType: "asc",
        },
      ],
    };

    if (query?.recurringType) {
      mangoQuery.selector.recurringType = query.recurringType;
    }

    const result = await this.db.find(mangoQuery);

    return (result as any).docs.map((doc: any) =>
      new PouchDBRecurringTaskDocument(doc).toRecurringTask()
    );
  }
}
