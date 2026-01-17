import { createRxDatabase } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import type { 
  EditorDocument, 
  EditorDocumentCreateInput, 
  EditorDocumentUpdateInput,
  EditorDocumentQuery 
} from '../types/editor-document';
import { databaseSchema } from './schema';

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  createDocument(input: EditorDocumentCreateInput): Promise<EditorDocument>;
  getDocument(id: string): Promise<EditorDocument | null>;
  updateDocument(id: string, input: EditorDocumentUpdateInput): Promise<EditorDocument | null>;
  deleteDocument(id: string): Promise<boolean>;
  getAllDocuments(): Promise<EditorDocument[]>;
  queryDocuments(query: EditorDocumentQuery): Promise<EditorDocument[]>;
  observeDocument(id: string): any;
  observeAllDocuments(): any;
  exportDocuments(): Promise<EditorDocument[]>;
  importDocuments(documents: EditorDocument[]): Promise<void>;
  clearAllDocuments(): Promise<void>;
  getDatabaseStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    lastUpdated: Date | null;
  }>;
}

export class TipTapEditorDB implements DatabaseAdapter {
  private static instance: TipTapEditorDB;
  private db: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TipTapEditorDB {
    if (!TipTapEditorDB.instance) {
      TipTapEditorDB.instance = new TipTapEditorDB();
    }
    return TipTapEditorDB.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await createRxDatabase({
        name: 'editor-db',
        storage: getRxStorageDexie(),
      });

      await this.db.addCollections(databaseSchema.collections);
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  async createDocument(input: EditorDocumentCreateInput): Promise<EditorDocument> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const document: EditorDocument = {
      id: input.id ? input.id : this.generateId(),
      content: input.content,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      version: 1,
      tags: input.tags || [],
      metadata: input.metadata || {},
    };

    await this.db.documents.insert(document);
    return document;
  }

  async getDocument(id: string): Promise<EditorDocument | null> {
    this.ensureInitialized();
    
    const doc = await this.db.documents.findOne(id).exec();
    return doc ? doc.toJSON() : null;
  }

  async updateDocument(id: string, input: EditorDocumentUpdateInput): Promise<EditorDocument | null> {
    this.ensureInitialized();
    
    const existingDoc = await this.getDocument(id);
    if (!existingDoc) {
      return null;
    }

    const updateData: Partial<EditorDocument> = {
      ...input,
      updatedAt: new Date(),
      version: existingDoc.version + 1,
    };

    await this.db.documents.upsert({
      ...existingDoc,
      ...updateData,
    });

    return this.getDocument(id);
  }

  async deleteDocument(id: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      await this.db.documents.findOne(id).remove();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllDocuments(): Promise<EditorDocument[]> {
    this.ensureInitialized();
    
    const docs = await this.db.documents.find().exec();
    return docs.map((doc: any) => doc.toJSON());
  }

  async queryDocuments(query: EditorDocumentQuery): Promise<EditorDocument[]> {
    this.ensureInitialized();
    
    let queryBuilder = this.db.documents.find();

    if (query.id) {
      queryBuilder = queryBuilder.where('id').equals(query.id);
    }

    if (query.tags && query.tags.length > 0) {
      queryBuilder = queryBuilder.where('tags').containsAny(query.tags);
    }

    if (query.dateRange) {
      queryBuilder = queryBuilder.where('createdAt')
        .gte(query.dateRange.start.toISOString())
        .lte(query.dateRange.end.toISOString());
    }

    const docs = await queryBuilder.exec();
    return docs.map((doc: any) => doc.toJSON());
  }

  async searchDocuments(searchTerm: string): Promise<EditorDocument[]> {
    this.ensureInitialized();
    
    const docs = await this.db.documents.find({
      selector: {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { 'content.content': { $regex: searchTerm, $options: 'i' } },
        ],
      },
    }).exec();

    return docs.map((doc: any) => doc.toJSON());
  }

  observeDocument(id: string): any {
    this.ensureInitialized();
    return this.db.documents.findOne(id).$;
  }

  observeAllDocuments(): any {
    this.ensureInitialized();
    return this.db.documents.find().$;
  }

  async exportDocuments(): Promise<EditorDocument[]> {
    return this.getAllDocuments();
  }

  async importDocuments(documents: EditorDocument[]): Promise<void> {
    this.ensureInitialized();
    
    for (const doc of documents) {
      await this.db.documents.upsert(doc);
    }
  }

  async clearAllDocuments(): Promise<void> {
    this.ensureInitialized();
    await this.db.documents.remove();
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getDatabaseStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    lastUpdated: Date | null;
  }> {
    this.ensureInitialized();
    
    const docs = await this.getAllDocuments();
    const totalSize = JSON.stringify(docs).length;
    const lastUpdated = docs.length > 0 
      ? docs.reduce((latest, doc) => 
          new Date(doc.updatedAt) > new Date(latest.updatedAt) ? doc : latest
        ).updatedAt
      : null;

    return {
      totalDocuments: docs.length,
      totalSize,
      lastUpdated,
    };
  }
}

export class EditorDBService {
  private adapter: DatabaseAdapter;

  constructor(adapter: DatabaseAdapter = TipTapEditorDB.getInstance()) {
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    return this.adapter.initialize();
  }

  async createDocument(input: EditorDocumentCreateInput): Promise<EditorDocument> {
    return this.adapter.createDocument(input);
  }

  async getDocument(id: string): Promise<EditorDocument | null> {
    return this.adapter.getDocument(id);
  }

  async updateDocument(id: string, input: EditorDocumentUpdateInput): Promise<EditorDocument | null> {
    return this.adapter.updateDocument(id, input);
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.adapter.deleteDocument(id);
  }

  async getAllDocuments(): Promise<EditorDocument[]> {
    return this.adapter.getAllDocuments();
  }

  async queryDocuments(query: EditorDocumentQuery): Promise<EditorDocument[]> {
    return this.adapter.queryDocuments(query);
  }


  observeDocument(id: string): any {
    return this.adapter.observeDocument(id);
  }

  observeAllDocuments(): any {
    return this.adapter.observeAllDocuments();
  }

  async exportDocuments(): Promise<EditorDocument[]> {
    return this.adapter.exportDocuments();
  }

  async importDocuments(documents: EditorDocument[]): Promise<void> {
    return this.adapter.importDocuments(documents);
  }

  async clearAllDocuments(): Promise<void> {
    return this.adapter.clearAllDocuments();
  }

  async getDatabaseStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    lastUpdated: Date | null;
  }> {
    return this.adapter.getDatabaseStats();
  }
}

export const editorDB = TipTapEditorDB.getInstance();
