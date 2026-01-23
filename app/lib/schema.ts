import type { Note } from './types/note';

const  noteSchema = {
  title: 'notes',
  description: 'notes',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    user_id: {
      type: 'string',
      maxLength: 100,
    },
    content: {
      type: 'string',
    },
    created_at: {
      type: 'string',
    },
    updated_at: {
      type: 'string',
    },
  },
  required: ['id'],
} as const;

const databaseSchema = {
  version: 2,
  name: 'editor-db',
  collections: {
    notes: {
      schema: noteSchema,
    },
  },
} as const;

export { noteSchema, databaseSchema };
export type { Note };
