import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import type { EditorDocument } from '../types/editor-document';

const editorDocumentSchema = {
  title: 'editor document',
  description: 'editor document content',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    content: {
      type: 'array',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
    version: {
      type: 'number',
      minimum: 1,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    metadata: {
      type: 'object',
    },
  },
  required: ['id', 'content', 'createdAt', 'updatedAt', 'version'],
  indexes: [
    ['title'],
    ['createdAt'],
    ['updatedAt'],
    ['tags'],
  ],
} as const;

const databaseSchema = {
  version: 1,
  name: 'editor-db',
  collections: {
    documents: {
      schema: editorDocumentSchema,
    },
  },
} as const;

export { editorDocumentSchema, databaseSchema };
export type { EditorDocument };
