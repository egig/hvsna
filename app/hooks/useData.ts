import { useCallback } from 'react';
import type { EditorDocument } from '../lib/types/editor-document';
import { useDatabase } from '../lib/database';

export const useData = () => {
  const {db} = useDatabase();

  const getDocument = useCallback(async (id: string): Promise<EditorDocument | null> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const doc = await db.documents.findOne(id).exec();
      return doc ? doc.toJSON() : null;
    } catch (err) {
      throw new Error(`Failed to get document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const saveDocument = useCallback(async (document: Omit<EditorDocument, 'createdAt' | 'updatedAt'>): Promise<EditorDocument> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const now = Date.now();
      const existingDoc = await db.documents.findOne(document.id).exec();
      
      if (existingDoc) {
        await existingDoc.modify((doc: any) => {
          doc.content = document.content;
          doc.updatedAt = now;
          return doc;
        });
        
        return existingDoc.toJSON();
      } else {
        const docData = {
          ...document,
          createdAt: now,
          updatedAt: now,
        };
        const newDoc = await db.documents.upsert(docData);
        return newDoc.toJSON();
      }
    } catch (err) {
      throw new Error(`Failed to save document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);


  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const doc = await db.documents.findOne(id).exec();
      if (doc) {
        await doc.remove();
      }
    } catch (err) {
      throw new Error(`Failed to delete document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const getAllDocuments = useCallback(async (): Promise<EditorDocument[]> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const docs = await db.documents.find().exec();
      return docs.map((doc: any) => doc.toJSON());
    } catch (err) {
      throw new Error(`Failed to get all documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const queryDocuments = useCallback(async (query: any): Promise<EditorDocument[]> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const docs = await db.documents.find(query).exec();
      return docs.map((doc: any) => doc.toJSON());
    } catch (err) {
      throw new Error(`Failed to query documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  return {
    db,
    getDocument,
    saveDocument,
    deleteDocument,
    getAllDocuments,
    queryDocuments,
  };
};
