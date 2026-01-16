import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditorDBService } from '../database/editor-db';
import { MockDatabaseAdapter } from './mocks/mock-database';
import { EditorUtils } from '../utils/editor-utils';
import type { EditorDocument, EditorDocumentCreateInput } from '../types/editor-document';

describe('EditorDBService', () => {
  let db: EditorDBService;
  let mockAdapter: MockDatabaseAdapter;

  beforeEach(async () => {
    mockAdapter = new MockDatabaseAdapter();
    db = new EditorDBService(mockAdapter);
    await db.initialize();
    await db.clearAllDocuments();
  });

  afterEach(async () => {
    if (db) {
      await db.clearAllDocuments();
    }
  });

  describe('Document Creation', () => {
    it('should create a new document', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Test Document',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Hello World' }
              ]
            }
          ]
        },
        tags: ['test'],
        metadata: { author: 'test-user' }
      };

      const document = await db.createDocument(input);

      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.title).toBe(input.title);
      expect(document.content).toEqual(input.content);
      expect(document.tags).toEqual(input.tags);
      expect(document.metadata).toEqual(input.metadata);
      expect(document.version).toBe(1);
      expect(document.createdAt).toBeInstanceOf(Date);
      expect(document.updatedAt).toBeInstanceOf(Date);
    });

    it('should create document with minimal data', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Minimal Document',
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph' }
          ]
        }
      };

      const document = await db.createDocument(input);

      expect(document.tags).toEqual([]);
      expect(document.metadata).toEqual({});
    });
  });

  describe('Document Retrieval', () => {
    it('should retrieve a document by id', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Test Document',
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph' }
          ]
        }
      };

      const created = await db.createDocument(input);
      const retrieved = await db.getDocument(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe(created.title);
    });

    it('should return null for non-existent document', async () => {
      const result = await db.getDocument('non-existent-id');
      expect(result).toBeNull();
    });

    it('should retrieve all documents', async () => {
      const input1: EditorDocumentCreateInput = {
        title: 'Document 1',
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      };

      const input2: EditorDocumentCreateInput = {
        title: 'Document 2',
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      };

      await db.createDocument(input1);
      await db.createDocument(input2);

      const allDocs = await db.getAllDocuments();
      expect(allDocs).toHaveLength(2);
    });
  });

  describe('Document Updates', () => {
    it('should update an existing document', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Original Title',
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Original' }] }
          ]
        }
      };

      const created = await db.createDocument(input);
      const updated = await db.updateDocument(created.id, {
        title: 'Updated Title',
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Updated' }] }
          ]
        }
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.version).toBe(2);
    });

    it('should return null when updating non-existent document', async () => {
      const result = await db.updateDocument('non-existent-id', {
        title: 'New Title'
      });
      expect(result).toBeNull();
    });
  });

  describe('Document Deletion', () => {
    it('should delete a document', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'To Delete',
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      };

      const created = await db.createDocument(input);
      const deleted = await db.deleteDocument(created.id);

      expect(deleted).toBe(true);

      const retrieved = await db.getDocument(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent document', async () => {
      const result = await db.deleteDocument('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('Document Search', () => {
    beforeEach(async () => {
      const documents: EditorDocumentCreateInput[] = [
        {
          title: 'JavaScript Guide',
          content: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Learn JavaScript programming' }] }
            ]
          },
          tags: ['programming', 'javascript']
        },
        {
          title: 'TypeScript Tutorial',
          content: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'TypeScript basics' }] }
            ]
          },
          tags: ['programming', 'typescript']
        }
      ];

      for (const doc of documents) {
        await db.createDocument(doc);
      }
    });

    it('should search documents by title', async () => {
      const results = await db.searchDocuments('JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Guide');
    });

    it('should search documents by content', async () => {
      const results = await db.searchDocuments('TypeScript basics');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('TypeScript Tutorial');
    });

    it('should query documents by tags', async () => {
      const results = await db.queryDocuments({
        tags: ['programming']
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('Database Operations', () => {
    it('should get database statistics', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Stats Test',
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      };

      await db.createDocument(input);
      const stats = await db.getDatabaseStats();

      expect(stats.totalDocuments).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('should export and import documents', async () => {
      const input: EditorDocumentCreateInput = {
        title: 'Export Test',
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      };

      await db.createDocument(input);
      const exported = await db.exportDocuments();
      expect(exported).toHaveLength(1);

      await db.clearAllDocuments();
      const cleared = await db.getAllDocuments();
      expect(cleared).toHaveLength(0);

      await db.importDocuments(exported);
      const imported = await db.getAllDocuments();
      expect(imported).toHaveLength(1);
      expect(imported[0].title).toBe('Export Test');
    });
  });
});

describe('EditorUtils', () => {
  describe('Document Creation', () => {
    it('should create empty document', () => {
      const doc = EditorUtils.createEmptyDocument();
      
      expect(doc.title).toBe('Untitled Document');
      expect(doc.content.type).toBe('doc');
      expect(doc.content.content).toHaveLength(1);
      expect(doc.content.content![0].type).toBe('paragraph');
    });

    it('should create empty document with custom title', () => {
      const doc = EditorUtils.createEmptyDocument('Custom Title');
      expect(doc.title).toBe('Custom Title');
    });
  });

  describe('Content Validation', () => {
    it('should validate JSON content', () => {
      const validContent = {
        type: 'doc',
        content: [
          { type: 'paragraph' }
        ]
      };

      const invalidContent = {
        type: 'paragraph',
        content: []
      };

      expect(EditorUtils.isValidJSONContent(validContent)).toBe(true);
      expect(EditorUtils.isValidJSONContent(invalidContent)).toBe(false);
    });
  });

  describe('Text Processing', () => {
    const sampleContent = {
      type: 'doc' as const,
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text' as const, text: 'Hello ' },
            { type: 'text' as const, text: 'world!' }
          ]
        }
      ]
    };

    it('should extract text from content', () => {
      const text = EditorUtils.extractTextFromContent(sampleContent);
      expect(text).toBe('Hello world!');
    });

    it('should count words', () => {
      const count = EditorUtils.getWordCount(sampleContent);
      expect(count).toBe(2);
    });

    it('should count characters', () => {
      const count = EditorUtils.getCharacterCount(sampleContent);
      expect(count).toBe(12);
    });

    it('should generate summary', () => {
      const longContent = {
        type: 'doc' as const,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text' as const, text: 'This is a very long text that should be truncated when generating a summary' }
            ]
          }
        ]
      };

      const summary = EditorUtils.generateDocumentSummary(longContent, 20);
      expect(summary).toBe('This is a very long ...');
    });

    it('should calculate reading time', () => {
      const readingTime = EditorUtils.getDocumentReadingTime(sampleContent);
      expect(readingTime).toBe(1);
    });
  });

  describe('Document Utilities', () => {
    const sampleDoc: EditorDocument = {
      id: 'test-doc',
      title: 'Test Document',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph' }
        ]
      },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      version: 1,
      tags: ['test', 'sample'],
      metadata: { author: 'test-user' }
    };

    it('should sanitize document title', () => {
      const dirtyTitle = 'Test<>:"/\\|?*Document';
      const cleanTitle = EditorUtils.sanitizeDocumentTitle(dirtyTitle);
      expect(cleanTitle).toBe('TestDocument');
    });

    it('should generate document slug', () => {
      const slug = EditorUtils.generateDocumentSlug('Test Document Title');
      expect(slug).toBe('test-document-title');
    });

    it('should create and restore backup', () => {
      const backup = EditorUtils.createDocumentBackup(sampleDoc);
      expect(backup).toContain('"id": "test-doc"');

      const restored = EditorUtils.restoreDocumentFromBackup(backup);
      expect(restored).toEqual(sampleDoc);
    });

    it('should compare documents', () => {
      const modifiedDoc = {
        ...sampleDoc,
        title: 'Modified Title'
      };

      const comparison = EditorUtils.compareDocuments(sampleDoc, modifiedDoc);
      expect(comparison.isEqual).toBe(false);
      expect(comparison.differences).toContain('title');
    });

    it('should validate document', () => {
      const validation = EditorUtils.validateDocument(sampleDoc);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      const invalidDoc = { ...sampleDoc, title: '' };
      const invalidValidation = EditorUtils.validateDocument(invalidDoc);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Document Sorting and Filtering', () => {
    const sampleDocs: EditorDocument[] = [
      {
        id: 'doc1',
        title: 'A Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        version: 1,
        tags: ['tag1'],
        metadata: {}
      },
      {
        id: 'doc2',
        title: 'Z Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        version: 1,
        tags: ['tag2'],
        metadata: {}
      }
    ];

    it('should filter documents by tag', () => {
      const filtered = EditorUtils.filterDocumentsByTag(sampleDocs, 'tag1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('doc1');
    });

    it('should get unique tags', () => {
      const tags = EditorUtils.getUniqueTagsFromDocuments(sampleDocs);
      expect(tags).toEqual(['tag1', 'tag2']);
    });

    it('should sort by date', () => {
      const sorted = EditorUtils.sortDocumentsByDate(sampleDocs, 'desc');
      expect(sorted[0].id).toBe('doc2');
    });

    it('should sort by title', () => {
      const sorted = EditorUtils.sortDocumentsByTitle(sampleDocs, 'asc');
      expect(sorted[0].id).toBe('doc1');
    });
  });
});
