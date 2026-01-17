import type { JSONContent } from '@tiptap/react';

export interface EditorDocument {
  id: string;
  content: JSONContent[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EditorDocumentCreateInput {
  id?: string;
  content: JSONContent[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EditorDocumentUpdateInput {
  content?: JSONContent[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EditorChange {
  id: string;
  documentId: string;
  type: 'create' | 'update' | 'delete';
  timestamp: Date;
  data: EditorDocument | EditorDocumentUpdateInput;
}

export type EditorDocumentQuery = {
  id?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
};
