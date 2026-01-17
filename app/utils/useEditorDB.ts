import { useState, useEffect, useCallback } from 'react';
import { TipTapEditorDB, EditorDBService } from '../../lib/database/editor-db';
import type { EditorDocument, EditorDocumentCreateInput, EditorDocumentUpdateInput, EditorDocumentQuery } from '../../lib/types/editor-document';

export interface UseEditorDBReturn {
  db: EditorDBService;
  isLoading: boolean;
  error: Error | null;
  createDocument: (input: EditorDocumentCreateInput) => Promise<EditorDocument>;
  getDocument: (id: string) => Promise<EditorDocument | null>;
  updateDocument: (id: string, input: EditorDocumentUpdateInput) => Promise<EditorDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  getAllDocuments: () => Promise<EditorDocument[]>;
  queryDocuments: (query: EditorDocumentQuery) => Promise<EditorDocument[]>;
  observeDocument: (id: string) => any;
  observeAllDocuments: () => any;
  exportDocuments: () => Promise<EditorDocument[]>;
  importDocuments: (documents: EditorDocument[]) => Promise<void>;
  clearAllDocuments: () => Promise<void>;
  getDatabaseStats: () => Promise<{
    totalDocuments: number;
    totalSize: number;
    lastUpdated: Date | null;
  }>;
}

export function useEditorDB(): UseEditorDBReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dbService] = useState(() => new EditorDBService(TipTapEditorDB.getInstance()));
  

  useEffect(() => {
    console.log('useEditorDB init');
    const initializeDB = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await dbService.initialize();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeDB();
  }, [dbService]);

  const createDocument = useCallback(async (input: EditorDocumentCreateInput) => {
    return await dbService.createDocument(input);
  }, [dbService]);

  const getDocument = useCallback(async (id: string) => {
    return await dbService.getDocument(id);
  }, [dbService]);

  const updateDocument = useCallback(async (id: string, input: EditorDocumentUpdateInput) => {
    return await dbService.updateDocument(id, input);
  }, [dbService]);

  const deleteDocument = useCallback(async (id: string) => {
    return await dbService.deleteDocument(id);
  }, [dbService]);

  const getAllDocuments = useCallback(async () => {
    return await dbService.getAllDocuments();
  }, [dbService]);

  const queryDocuments = useCallback(async (query: EditorDocumentQuery) => {
    return await dbService.queryDocuments(query);
  }, [dbService]);

  const observeDocument = useCallback((id: string) => {
    return dbService.observeDocument(id);
  }, [dbService]);

  const observeAllDocuments = useCallback(() => {
    return dbService.observeAllDocuments();
  }, [dbService]);

  const exportDocuments = useCallback(async () => {
    return await dbService.exportDocuments();
  }, [dbService]);

  const importDocuments = useCallback(async (documents: EditorDocument[]) => {
    return await dbService.importDocuments(documents);
  }, [dbService]);

  const clearAllDocuments = useCallback(async () => {
    return await dbService.clearAllDocuments();
  }, [dbService]);

  const getDatabaseStats = useCallback(async () => {
    return await dbService.getDatabaseStats();
  }, [dbService]);

  return {
    db: dbService,
    isLoading,
    error,
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    getAllDocuments,
    queryDocuments,
    observeDocument,
    observeAllDocuments,
    exportDocuments,
    importDocuments,
    clearAllDocuments,
    getDatabaseStats,
  };
}

export default useEditorDB;
