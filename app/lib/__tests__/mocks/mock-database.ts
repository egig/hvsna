import type { 
  EditorDocument, 
  EditorDocumentCreateInput, 
  EditorDocumentUpdateInput,
  EditorDocumentQuery 
} from '../../types/editor-document';
import type { DatabaseAdapter } from '../../database/editor-db';

export class MockDatabaseAdapter implements DatabaseAdapter {
  private documents: Map<string, EditorDocument> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }

  private generateId(): string {
    return `mock_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createDocument(input: EditorDocumentCreateInput): Promise<EditorDocument> {
    this.ensureInitialized();
    
    const now = new Date();
    const document: EditorDocument = {
      id: input.id || this.generateId(),
      content: input.content,
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: input.tags || [],
      metadata: input.metadata || {},
    };

    this.documents.set(document.id, document);
    return { ...document };
  }

  async getDocument(id: string): Promise<EditorDocument | null> {
    this.ensureInitialized();
    
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }

  async updateDocument(id: string, input: EditorDocumentUpdateInput): Promise<EditorDocument | null> {
    this.ensureInitialized();
    
    const existingDoc = this.documents.get(id);
    if (!existingDoc) {
      return null;
    }

    const updatedDoc: EditorDocument = {
      ...existingDoc,
      ...input,
      updatedAt: new Date(),
      version: existingDoc.version + 1,
    };

    this.documents.set(id, updatedDoc);
    return { ...updatedDoc };
  }

  async deleteDocument(id: string): Promise<boolean> {
    this.ensureInitialized();
    
    return this.documents.delete(id);
  }

  async getAllDocuments(): Promise<EditorDocument[]> {
    this.ensureInitialized();
    
    return Array.from(this.documents.values()).map(doc => ({ ...doc }));
  }

  async queryDocuments(query: EditorDocumentQuery): Promise<EditorDocument[]> {
    this.ensureInitialized();
    
    let results = Array.from(this.documents.values());

    if (query.id) {
      results = results.filter(doc => doc.id === query.id);
    }

    if (query.title) {
      const regex = new RegExp(query.title, 'i');
      results = results.filter(doc => regex.test(doc.title));
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(doc => 
        query.tags!.some((tag: string) => doc.tags?.includes(tag))
      );
    }

    if (query.dateRange) {
      const start = query.dateRange.start.getTime();
      const end = query.dateRange.end.getTime();
      results = results.filter(doc => {
        const createdAt = doc.createdAt.getTime();
        return createdAt >= start && createdAt <= end;
      });
    }

    return results.map(doc => ({ ...doc }));
  }


  observeDocument(id: string): any {
    this.ensureInitialized();
    
    return {
      subscribe: (callback: (doc: EditorDocument | null) => void) => {
        callback(this.documents.get(id) || null);
        return {
          unsubscribe: () => {}
        };
      }
    };
  }

  observeAllDocuments(): any {
    this.ensureInitialized();
    
    return {
      subscribe: (callback: (docs: EditorDocument[]) => void) => {
        callback(Array.from(this.documents.values()));
        return {
          unsubscribe: () => {}
        };
      }
    };
  }

  async exportDocuments(): Promise<EditorDocument[]> {
    return this.getAllDocuments();
  }

  async importDocuments(documents: EditorDocument[]): Promise<void> {
    this.ensureInitialized();
    
    for (const doc of documents) {
      this.documents.set(doc.id, { ...doc });
    }
  }

  async clearAllDocuments(): Promise<void> {
    this.ensureInitialized();
    this.documents.clear();
  }

  async getDatabaseStats(): Promise<{
    totalDocuments: number;
    totalSize: number;
    lastUpdated: Date | null;
  }> {
    this.ensureInitialized();
    
    const docs = Array.from(this.documents.values());
    const totalSize = JSON.stringify(docs).length;
    const lastUpdated = docs.length > 0 
      ? docs.reduce((latest, doc) => 
          doc.updatedAt > latest.updatedAt ? doc : latest
        ).updatedAt
      : null;

    return {
      totalDocuments: docs.length,
      totalSize,
      lastUpdated,
    };
  }

  private extractTextFromContent(content: any): string {
    if (!content.content) {
      return '';
    }

    let text = '';
    
    const extractFromNode = (node: any): void => {
      if (node.text) {
        text += node.text;
      }
      
      if (node.content) {
        node.content.forEach(extractFromNode);
      }
    };

    content.content.forEach(extractFromNode);
    return text;
  }
}
