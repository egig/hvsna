import type { JSONContent } from '@tiptap/react';

export interface EditorDocument {
  id: string;
  title: string;
  content: JSONContent;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EditorDocumentCreateInput {
  title: string;
  content: JSONContent;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EditorDocumentUpdateInput {
  title?: string;
  content?: JSONContent;
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
  title?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
};
