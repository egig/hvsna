import { useCallback } from 'react';
import type { Note } from '../../lib/types/note';
import { useDatabase } from '../../lib/database';
import { useUser } from '@clerk/clerk-react';

export const useData = () => {
  const {db} = useDatabase();
  const { isLoaded, isSignedIn, user } = useUser();

  const getDocument = useCallback(async (id: string): Promise<Note | null> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const doc = await db.notes.findOne(id).exec();
      if (doc) {
        const docData = doc.toJSON();
        return docData;
      }

      return null;
    } catch (err) {
      throw new Error(`Failed to get document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const saveDocument = useCallback(async (document: Omit<Note, 'createdAt' | 'updatedAt'>): Promise<Note> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const existingDoc = await db.notes.findOne(document.id).exec();
      if (existingDoc) {
        return await existingDoc.incrementalPatch({
          content: document.content,
          updated_at: new Date().toISOString()
        });
        
      } else {
        const docData = {
          ...document,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const newDoc = await db.notes.upsert(docData);
        return newDoc.toJSON();
      }
    } catch (err) {
      throw new Error(
        `Failed to save document: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }, [db, user?.id]);


  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const doc = await db.notes.findOne(id).exec();
      if (doc) {
        await doc.remove();
      }
    } catch (err) {
      throw new Error(`Failed to delete document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const getAllDocuments = useCallback(async (): Promise<Note[]> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const docs = await db.notes.find().exec();
      return docs.map((doc: any) => doc.toJSON());
    } catch (err) {
      throw new Error(`Failed to get all documents: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [db]);

  const queryDocuments = useCallback(async (query: any): Promise<Note[]> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const docs = await db.notes.find(query).exec();
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
