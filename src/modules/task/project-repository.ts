import { generatePrefixedUUID } from "..";
import { db } from "../pouchdb-singleton";
import {
  Project,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectQuery,
} from "./types";

class PouchDBProjectDocument {
  _id?: string;
  _rev?: string | undefined;
  type: "project" = "project";
  name?: string;
  description?: string;
  color?: string = "#3B82F6";
  icon?: string = "project";
  trackerEvaluationRefs?: any[];
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
      color: this.color || "#3B82F6",
      trackerEvaluationRefs: this.trackerEvaluationRefs,
      // icon: this.icon || "project",
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

export class ProjectRepository {
  private static instance: ProjectRepository;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ProjectRepository {
    if (!ProjectRepository.instance) {
      ProjectRepository.instance = new ProjectRepository();
    }
    return ProjectRepository.instance;
  }

  static resetInstance(): void {
    ProjectRepository.instance = null as any;
  }

  async create(input: ProjectCreateInput): Promise<Project> {
    const now = Date.now().valueOf();

    const newProject = new Project({
      id: generatePrefixedUUID("project_"),
      name: input.name,
      description: input.description,
      color: input.color || "#3B82F6",
      trackerEvaluationRefs: input.trackerEvaluationRefs,
      createdAt: now,
      updatedAt: now,
    });

    const doc = PouchDBProjectDocument.fromProjectItem(newProject);
    delete doc._rev;

    await (db as any).put(doc);

    return newProject;
  }

  async update(id: string, input: ProjectUpdateInput): Promise<Project> {
    const existingDoc = await (db as any).get(id);
    const updateData = new PouchDBProjectDocument({
      ...existingDoc,
      updatedAt: Date.now(),
    }).toProjectItem();

    // Check if field are inputted / undefined
    Object.assign(
      updateData,
      Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined)
      )
    );

    let ud = PouchDBProjectDocument.fromProjectItem(updateData);

    const response = await (db as any).put(ud);
    const updatedDoc = new PouchDBProjectDocument({
      ...updateData,
      _rev: response.rev,
    });

    return updatedDoc.toProjectItem();
  }

  async delete(id: string, deleteTasks: boolean = false): Promise<void> {
    const doc: PouchDBProjectDocument = await (db as any).get(id);

    if (!doc._rev) {
      throw new Error("Document revision is required for deletion");
    }

    // Handle associated tasks based on deleteTasks parameter
    await db.createIndex({
      index: {
        fields: ["type", "projectId"],
      },
    });

    const mangoQuery = {
      selector: {
        type: "task",
        projectId: id,
      },
    };

    const result = await (db as any).find(mangoQuery);
    const tasks = (result as any).docs;

    if (deleteTasks) {
      // Delete all tasks associated with this project
      for (const task of tasks) {
        await (db as any).remove(task);
      }
    } else {
      // Set projectId to null for all associated tasks
      for (const task of tasks) {
        const updatedTask = {
          ...task,
          projectId: null,
          updatedAt: Date.now(),
        };
        await (db as any).put(updatedTask);
      }
    }

    // Finally, delete the project document
    await (db as any).remove(doc as any);
  }

  async findById(id: string): Promise<Project | null> {
    try {
      const doc: PouchDBProjectDocument = await (db as any).get(id);
      return new PouchDBProjectDocument(doc).toProjectItem();
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      throw err;
    }
  }

  async find(query?: ProjectQuery): Promise<Project[]> {
    await (db as any).createIndex({
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

    const result = await (db as any).find(mangoQuery);

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
      sort: [{ _id: "asc" }],
      limit,
      skip: offset,
    };

    const result = await (db as any).find(mangoQuery);

    return (result as any).docs.map((doc: PouchDBProjectDocument) => ({
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
export const projectRepository = ProjectRepository.getInstance();
