import type { JSONContent } from "@tiptap/react";

export interface Note {
  id: string;
  user_id: string;
  content: JSONContent[];
  created_at?: string;
  updated_at?: string;
}

export interface NoteCreateInput {
  id?: string;
  content: JSONContent[];
}

export interface NoteUpdateInput {
  content?: JSONContent[];
}

export interface NoteChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: Note | NoteUpdateInput;
}

export type NoteQuery = {
  id?: string;
};
