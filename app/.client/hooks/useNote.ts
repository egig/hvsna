import { useState, useEffect, useCallback } from "react";
import type {
  Note,
  NoteCreateInput,
  NoteUpdateInput,
  NoteQuery,
} from "../../lib/types/note";
import { usePouchDB } from "../pouchdb";

interface PouchDBDocument {
  _id: string;
  _rev?: string;
  user_id: string;
  content: any[]; // Store as JSONContent[] directly
  created_at?: string;
  updated_at?: string;
}

export interface UseNoteReturn {
  notes: Note[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  createNote: (input: NoteCreateInput) => Promise<Note>;
  updateNote: (id: string, input: NoteUpdateInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNote: (id: string) => Promise<Note | null>;
  getNotes: (query?: NoteQuery) => Promise<Note[]>;
  refreshNotes: () => Promise<void>;
  loadMoreNotes: () => Promise<void>;
}

export const useNote = (): UseNoteReturn => {
  const { db } = usePouchDB();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const refreshNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setOffset(0);

      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        limit: PAGE_SIZE,
      });

      const notesList = result.rows
        .filter((row: any) => row.doc && !row.doc._id.startsWith("_"))
        .map((row: any) => {
          const doc: PouchDBDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            content: doc.content || [],
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });

      setNotes(notesList);
      setHasMore(result.rows.length >= PAGE_SIZE);
      setOffset(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [db]);

  const loadMoreNotes = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        skip: offset,
        limit: PAGE_SIZE,
      });

      const newNotes = result.rows
        .filter((row: any) => row.doc && !row.doc._id.startsWith("_"))
        .map((row: any) => {
          const doc: PouchDBDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            content: doc.content || [],
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });

      setNotes((prev) => [...prev, ...newNotes]);
      setHasMore(result.rows.length >= PAGE_SIZE);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more notes",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [db, loadingMore, hasMore, offset]);

  const createNote = useCallback(
    async (input: NoteCreateInput): Promise<Note> => {
      try {
        const now = new Date().toISOString();
        const noteId = input.id || crypto.randomUUID();

        const newNote: Note = {
          id: noteId,
          user_id: "default-user", // You might want to get this from auth context
          content: input.content,
          created_at: now,
          updated_at: now,
        };

        const doc: PouchDBDocument = {
          _id: noteId,
          user_id: newNote.user_id,
          content: newNote.content,
          created_at: newNote.created_at,
          updated_at: newNote.updated_at,
        };

        await db.put(doc);
        await refreshNotes();
        return newNote;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create note";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [db, refreshNotes],
  );

  const updateNote = useCallback(
    async (id: string, input: NoteUpdateInput): Promise<Note> => {
      try {
        const existingDoc: PouchDBDocument = await db.get(id);

        const updateData: PouchDBDocument = {
          ...existingDoc,
          updated_at: new Date().toISOString(),
        };

        if (input.content !== undefined) {
          updateData.content = input.content;
        }

        const response = await db.put(updateData);
        const updatedDoc: PouchDBDocument = await db.get(response.id);

        await refreshNotes();

        return {
          id: updatedDoc._id,
          user_id: updatedDoc.user_id,
          content: updatedDoc.content || [],
          created_at: updatedDoc.created_at,
          updated_at: updatedDoc.updated_at,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update note";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [db, refreshNotes],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      try {
        const doc: PouchDBDocument = await db.get(id);
        // Ensure _rev is present before removing
        if (!doc._rev) {
          throw new Error("Document revision is required for deletion");
        }
        await db.remove(doc as any);
        await refreshNotes();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete note";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [db, refreshNotes],
  );

  const getNote = useCallback(
    async (id: string): Promise<Note | null> => {
      try {
        const doc: PouchDBDocument = await db.get(id);
        return {
          id: doc._id,
          user_id: doc.user_id,
          content: doc.content || [],
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        };
      } catch (err) {
        if ((err as any).status === 404) {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get note";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [db],
  );

  const getNotes = useCallback(
    async (query?: NoteQuery): Promise<Note[]> => {
      try {
        let result;

        if (query?.id) {
          const doc: PouchDBDocument = await db.get(query.id);
          result = { rows: [{ doc }] };
        } else {
          result = await db.allDocs({
            include_docs: true,
            attachments: true,
          });
        }

        return result.rows
          .filter((row: any) => row.doc && !row.doc._id.startsWith("_"))
          .map((row: any) => {
            const doc: PouchDBDocument = row.doc;
            return {
              id: doc._id,
              user_id: doc.user_id,
              content: doc.content || [],
              created_at: doc.created_at,
              updated_at: doc.updated_at,
            };
          });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get notes";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [db],
  );

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  return {
    notes,
    loading,
    loadingMore,
    error,
    hasMore,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    getNotes,
    refreshNotes,
    loadMoreNotes,
  };
};
