import { generatePrefixedUUID } from "..";
import { db } from "../pouchdb-singleton";
import {
  List,
  type ListCreateInput,
  type ListUpdateInput,
  type ListQuery,
} from "./types";

class PouchDBListDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "list" = "list";
  name?: string;
  description?: string;
  color?: string = "#3B82F6";
  icon?: string = "list";
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
      color: this.color || "#3B82F6",
      icon: this.icon || "list",
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

export class ListRepository {
  private static instance: ListRepository;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ListRepository {
    if (!ListRepository.instance) {
      ListRepository.instance = new ListRepository();
    }
    return ListRepository.instance;
  }

  static resetInstance(): void {
    ListRepository.instance = null as any;
  }

  async create(input: ListCreateInput): Promise<List> {
    const now = Date.now().valueOf();

    const newList = new List({
      id: generatePrefixedUUID("list_"),
      name: input.name,
      description: input.description,
      color: input.color || "#3B82F6",
      createdAt: now,
      updatedAt: now,
    });

    const doc = PouchDBListDocument.fromListItem(newList);
    delete doc._rev;

    await (db as any).put(doc);

    return newList;
  }

  async update(id: string, input: ListUpdateInput): Promise<List> {
    const existingDoc = await (db as any).get(id);
    const updateData = new PouchDBListDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toListItem();

    // Check if field are inputted / undefined
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined),
      ),
    );

    let ud = PouchDBListDocument.fromListItem(updateData);

    const response = await (db as any).put(ud);
    const updatedDoc = new PouchDBListDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toListItem();
  }

  async delete(id: string, deleteTasks: boolean = false): Promise<void> {
    const doc: PouchDBListDocument = await (db as any).get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    // Handle associated tasks based on deleteTasks parameter
    await db.createIndex({
      index: {
        fields: ["type", "listId"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        listId: id,
      },
    };

    const result = await (db as any).find(mangoQuery);
    const tasks = (result as any).docs;

    if (deleteTasks) {
      // Delete all tasks associated with this list
      for (const task of tasks) {
        await (db as any).remove(task);
      }
    } else {
      // Set listId to null for all associated tasks
      for (const task of tasks) {
        const updatedTask = {
          ...task,
          listId: null,
          updatedAt: Date.now(),
        };
        await (db as any).put(updatedTask);
      }
    }

    // Finally, delete the list document
    await (db as any).remove(doc as any);
  }

  async findById(id: string): Promise<List | null> {
    try {
      const doc: PouchDBListDocument = await (db as any).get(id);
      return new PouchDBListDocument(doc).toListItem();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: ListQuery): Promise<List[]> {
    await (db as any).createIndex({
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

    const result = await (db as any).find(mangoQuery);

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
      sort: [{ _id: "asc" }],
      limit,
      skip: offset,
    };

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBListDocument) => ({
      id: doc._id,
      name: doc.name,
      description: doc.description,
      color: doc.color,
      icon: doc.icon,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}

// Export singleton instance
export const listRepository = ListRepository.getInstance();
