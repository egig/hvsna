import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEditorDB } from '../useEditorDB';
import { TipTapEditorDB, EditorDBService } from '../../../lib/database/editor-db';
import { MockDatabaseAdapter } from '../../../lib/__tests__/mocks/mock-database';
import type { EditorDocumentCreateInput, EditorDocumentUpdateInput, EditorDocumentQuery } from '../../../lib/types/editor-document';

// Mock the TipTapEditorDB.getInstance method
vi.mock('../../../lib/database/editor-db', async () => {
  const actual = await vi.importActual('../../../lib/database/editor-db');
  return {
    ...actual,
    TipTapEditorDB: {
      getInstance: vi.fn(() => new EditorDBService(new MockDatabaseAdapter())),
    },
  };
});

describe('useEditorDB', () => {
  let mockAdapter: MockDatabaseAdapter;

  beforeEach(() => {
    mockAdapter = new MockDatabaseAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize database on mount', async () => {
      const { result } = renderHook(() => useEditorDB());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.db).toBeDefined();
      });
    });

    it('should handle initialization error', async () => {
      const mockError = new Error('Database initialization failed');
      vi.spyOn(MockDatabaseAdapter.prototype, 'initialize').mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toEqual(mockError);
      });
    });

    it('should not reinitialize on re-render', async () => {
      const { result, rerender } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initializeSpy = vi.spyOn(MockDatabaseAdapter.prototype, 'initialize');
      
      rerender();

      expect(initializeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Document Operations', () => {
    beforeEach(async () => {
      await mockAdapter.initialize();
    });

    it('should create a document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Test document' }
              ]
            }
          ]
        },
        tags: ['test'],
        metadata: { author: 'test-user' }
      };

      const document = await result.current.createDocument(input);

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.content).toEqual(input.content);
      expect(document.tags).toEqual(input.tags);
      expect(document.metadata).toEqual(input.metadata);
      expect(document.version).toBe(1);
    });

    it('should get a document by id', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Test document' }
              ]
            }
          ]
        }
      };

      const createdDoc = await result.current.createDocument(input);
      const retrievedDoc = await result.current.getDocument(createdDoc.id);

      expect(retrievedDoc).toEqual(createdDoc);
    });

    it('should return null for non-existent document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const doc = await result.current.getDocument('non-existent-id');
      expect(doc).toBe(null);
    });

    it('should update a document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Original content' }
              ]
            }
          ]
        },
        tags: ['original']
      };

      const createdDoc = await result.current.createDocument(input);

      const updateInput: EditorDocumentUpdateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Updated content' }
              ]
            }
          ]
        },
        tags: ['updated']
      };

      const updatedDoc = await result.current.updateDocument(createdDoc.id, updateInput);

      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.content).toEqual(updateInput.content);
      expect(updatedDoc?.tags).toEqual(updateInput.tags);
      expect(updatedDoc?.version).toBe(2);
    });

    it('should return null when updating non-existent document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updateInput: EditorDocumentUpdateInput = {
        content: {
          type: 'doc',
          content: []
        }
      };

      const result_doc = await result.current.updateDocument('non-existent-id', updateInput);
      expect(result_doc).toBe(null);
    });

    it('should delete a document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Test document' }
              ]
            }
          ]
        }
      };

      const createdDoc = await result.current.createDocument(input);
      const deleteResult = await result.current.deleteDocument(createdDoc.id);

      expect(deleteResult).toBe(true);

      const retrievedDoc = await result.current.getDocument(createdDoc.id);
      expect(retrievedDoc).toBe(null);
    });

    it('should return false when deleting non-existent document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const deleteResult = await result.current.deleteDocument('non-existent-id');
      expect(deleteResult).toBe(false);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await mockAdapter.initialize();
    });

    it('should get all documents', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input1: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Document 1' }
              ]
            }
          ]
        },
        tags: ['tag1']
      };

      const input2: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Document 2' }
              ]
            }
          ]
        },
        tags: ['tag2']
      };

      await result.current.createDocument(input1);
      await result.current.createDocument(input2);

      const allDocs = await result.current.getAllDocuments();
      expect(allDocs).toHaveLength(2);
    });

    it('should query documents by tags', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input1: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        },
        tags: ['important', 'work']
      };

      const input2: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        },
        tags: ['personal']
      };

      await result.current.createDocument(input1);
      await result.current.createDocument(input2);

      const query: EditorDocumentQuery = {
        tags: ['important']
      };

      const results = await result.current.queryDocuments(query);
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('important');
    });
  });

  describe('Observable Operations', () => {
    beforeEach(async () => {
      await mockAdapter.initialize();
    });

    it('should observe a single document', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        }
      };

      const createdDoc = await result.current.createDocument(input);
      const observable = result.current.observeDocument(createdDoc.id);

      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should observe all documents', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const observable = result.current.observeAllDocuments();

      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('Utility Operations', () => {
    beforeEach(async () => {
      await mockAdapter.initialize();
    });

    it('should export documents', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        }
      };

      await result.current.createDocument(input);

      const exportedDocs = await result.current.exportDocuments();
      expect(exportedDocs).toHaveLength(1);
    });

    it('should import documents', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const documents = [
        {
          id: 'imported-doc-1',
          content: {
            type: 'doc',
            content: []
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: ['imported'],
          metadata: {}
        }
      ] as any[];

      await result.current.importDocuments(documents);

      const allDocs = await result.current.getAllDocuments();
      expect(allDocs).toHaveLength(1);
      expect(allDocs[0].id).toBe('imported-doc-1');
    });

    it('should clear all documents', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        }
      };

      await result.current.createDocument(input);
      await result.current.clearAllDocuments();

      const allDocs = await result.current.getAllDocuments();
      expect(allDocs).toHaveLength(0);
    });

    it('should get database stats', async () => {
      const { result } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const input: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: []
        }
      };

      await result.current.createDocument(input);

      const stats = await result.current.getDatabaseStats();
      expect(stats.totalDocuments).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Callback Stability', () => {
    it('should provide stable callback references', async () => {
      const { result, rerender } = renderHook(() => useEditorDB());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallbacks = {
        createDocument: result.current.createDocument,
        getDocument: result.current.getDocument,
        updateDocument: result.current.updateDocument,
        deleteDocument: result.current.deleteDocument,
        getAllDocuments: result.current.getAllDocuments,
        queryDocuments: result.current.queryDocuments,
        searchDocuments: result.current.searchDocuments,
        observeDocument: result.current.observeDocument,
        observeAllDocuments: result.current.observeAllDocuments,
        exportDocuments: result.current.exportDocuments,
        importDocuments: result.current.importDocuments,
        clearAllDocuments: result.current.clearAllDocuments,
        getDatabaseStats: result.current.getDatabaseStats,
      };

      rerender();

      // All callbacks should be the same reference after re-render
      expect(result.current.createDocument).toBe(initialCallbacks.createDocument);
      expect(result.current.getDocument).toBe(initialCallbacks.getDocument);
      expect(result.current.updateDocument).toBe(initialCallbacks.updateDocument);
      expect(result.current.deleteDocument).toBe(initialCallbacks.deleteDocument);
      expect(result.current.getAllDocuments).toBe(initialCallbacks.getAllDocuments);
      expect(result.current.queryDocuments).toBe(initialCallbacks.queryDocuments);
      expect(result.current.searchDocuments).toBe(initialCallbacks.searchDocuments);
      expect(result.current.observeDocument).toBe(initialCallbacks.observeDocument);
      expect(result.current.observeAllDocuments).toBe(initialCallbacks.observeAllDocuments);
      expect(result.current.exportDocuments).toBe(initialCallbacks.exportDocuments);
      expect(result.current.importDocuments).toBe(initialCallbacks.importDocuments);
      expect(result.current.clearAllDocuments).toBe(initialCallbacks.clearAllDocuments);
      expect(result.current.getDatabaseStats).toBe(initialCallbacks.getDatabaseStats);
    });
  });
});
