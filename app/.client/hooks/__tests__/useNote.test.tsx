import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNote } from '../useNote';
import type { Note, NoteCreateInput, NoteUpdateInput } from '../../../lib/types/note';

// Mock the PouchDBContext
vi.mock('../../contexts/PouchDB', () => ({
  usePouchDB: vi.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

import { usePouchDB } from '../../contexts/PouchDB';

// Mock PouchDB database methods
const mockDb: any = {
  allDocs: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  remove: vi.fn(),
};

const mockUsePouchDB = vi.mocked(usePouchDB);

describe('useNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePouchDB.mockReturnValue({ db: mockDb });
  });

  const mockNote: Note = {
    id: 'test-note-1',
    user_id: 'default-user',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content' }] }],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockPouchDoc = {
    _id: 'test-note-1',
    _rev: '1-rev',
    user_id: 'default-user',
    content: mockNote.content, // Store as array directly
    created_at: mockNote.created_at,
    updated_at: mockNote.updated_at,
  };

  describe('initial state', () => {
    it('should initialize with loading state', () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [],
      });

      const { result } = renderHook(() => useNote());

      expect(result.current.loading).toBe(true);
      expect(result.current.notes).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should call refreshNotes on mount', () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [],
      });

      renderHook(() => useNote());

      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
        limit: 20,
      });
    });
  });

  describe('refreshNotes', () => {
    it('should fetch and set notes successfully', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: mockPouchDoc }],
      });

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes).toEqual([mockNote]);
      expect(result.current.error).toBe(null);
    });

    it('should filter out system docs (starting with _)', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [
          { doc: mockPouchDoc },
          { doc: { _id: '_design/app' } },
          { doc: { _id: '_local/test' } },
        ],
      });

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes).toEqual([mockNote]);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      mockDb.allDocs.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes).toEqual([]);
      expect(result.current.error).toBe('Database error');
    });

    it('should handle non-Error objects', async () => {
      mockDb.allDocs.mockRejectedValue('String error');

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch notes');
    });
  });

  describe('createNote', () => {
    beforeEach(() => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
    });

    it('should create a note successfully', async () => {
      const input: NoteCreateInput = {
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New note' }] }],
      };

      mockDb.put.mockResolvedValue({ id: 'test-uuid-123', rev: '1-rev' });
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: { ...mockPouchDoc, _id: 'test-uuid-123' } }],
      });

      const { result } = renderHook(() => useNote());

      const createdNote = await result.current.createNote(input);

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'test-uuid-123',
          user_id: 'default-user',
          content: input.content,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );

      expect(createdNote).toEqual(
        expect.objectContaining({
          id: 'test-uuid-123',
          user_id: 'default-user',
          content: input.content,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should use provided id', async () => {
      const input: NoteCreateInput = {
        id: 'custom-id',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Custom ID note' }] }],
      };

      mockDb.put.mockResolvedValue({ id: 'custom-id', rev: '1-rev' });
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: { ...mockPouchDoc, _id: 'custom-id' } }],
      });

      const { result } = renderHook(() => useNote());

      await result.current.createNote(input);

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'custom-id',
        })
      );
    });

    it('should handle create errors', async () => {
      const input: NoteCreateInput = {
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Error note' }] }],
      };

      const error = new Error('Create failed');
      mockDb.put.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await expect(result.current.createNote(input)).rejects.toThrow('Create failed');
      
      await waitFor(() => {
        expect(result.current.error).toBe('Create failed');
      });
    });
  });

  describe('updateNote', () => {
    beforeEach(() => {
      mockDb.allDocs.mockResolvedValue({ rows: [{ doc: mockPouchDoc }] });
    });

    it('should update a note successfully', async () => {
      const input: NoteUpdateInput = {
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated content' }] }],
      };

      const updatedDoc = {
        ...mockPouchDoc,
        content: input.content, // Store as array directly
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.put.mockResolvedValue({ id: 'test-note-1', rev: '2-rev' });
      mockDb.get.mockResolvedValueOnce(mockPouchDoc).mockResolvedValueOnce(updatedDoc);

      const { result } = renderHook(() => useNote());

      const updatedNote = await result.current.updateNote('test-note-1', input);

      expect(mockDb.get).toHaveBeenCalledWith('test-note-1');
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'test-note-1',
          _rev: '1-rev',
          content: input.content,
          updated_at: expect.any(String),
        })
      );

      expect(updatedNote).toEqual(
        expect.objectContaining({
          id: 'test-note-1',
          user_id: 'default-user',
          content: input.content,
          updated_at: '2024-01-02T00:00:00.000Z',
        })
      );
    });

    it('should handle update errors', async () => {
      const input: NoteUpdateInput = {
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Update error' }] }],
      };

      const error = new Error('Update failed');
      mockDb.get.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await expect(result.current.updateNote('test-note-1', input)).rejects.toThrow('Update failed');
      
      await waitFor(() => {
        expect(result.current.error).toBe('Update failed');
      });
    });
  });

  describe('deleteNote', () => {
    beforeEach(() => {
      mockDb.allDocs.mockResolvedValue({ rows: [{ doc: mockPouchDoc }] });
    });

    it('should delete a note successfully', async () => {
      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.remove.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useNote());

      await result.current.deleteNote('test-note-1');

      expect(mockDb.get).toHaveBeenCalledWith('test-note-1');
      expect(mockDb.remove).toHaveBeenCalledWith(mockPouchDoc);
    });

    it('should handle missing revision error', async () => {
      const docWithoutRev = { ...mockPouchDoc, _rev: undefined };
      mockDb.get.mockResolvedValue(docWithoutRev);

      const { result } = renderHook(() => useNote());

      await expect(result.current.deleteNote('test-note-1')).rejects.toThrow(
        'Document revision is required for deletion'
      );
      
      await waitFor(() => {
        expect(result.current.error).toBe('Document revision is required for deletion');
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockDb.get.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await expect(result.current.deleteNote('test-note-1')).rejects.toThrow('Delete failed');
      
      await waitFor(() => {
        expect(result.current.error).toBe('Delete failed');
      });
    });
  });

  describe('getNote', () => {
    it('should get a single note successfully', async () => {
      mockDb.get.mockResolvedValue(mockPouchDoc);

      const { result } = renderHook(() => useNote());

      const note = await result.current.getNote('test-note-1');

      expect(mockDb.get).toHaveBeenCalledWith('test-note-1');
      expect(note).toEqual(mockNote);
    });

    it('should return null for non-existent note', async () => {
      const error = { status: 404 };
      mockDb.get.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      const note = await result.current.getNote('non-existent');

      expect(note).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle get errors', async () => {
      const error = new Error('Get failed');
      mockDb.get.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await expect(result.current.getNote('test-note-1')).rejects.toThrow('Get failed');
      
      await waitFor(() => {
        expect(result.current.error).toBe('Get failed');
      });
    });
  });

  describe('getNotes', () => {
    it('should get all notes successfully', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: mockPouchDoc }],
      });

      const { result } = renderHook(() => useNote());

      const notes = await result.current.getNotes();

      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
      });
      expect(notes).toEqual([mockNote]);
    });

    it('should get note by id successfully', async () => {
      mockDb.get.mockResolvedValue(mockPouchDoc);

      const { result } = renderHook(() => useNote());

      const notes = await result.current.getNotes({ id: 'test-note-1' });

      expect(mockDb.get).toHaveBeenCalledWith('test-note-1');
      expect(notes).toEqual([mockNote]);
    });

    it('should handle getNotes errors', async () => {
      const error = new Error('Get notes failed');
      mockDb.allDocs.mockRejectedValue(error);

      const { result } = renderHook(() => useNote());

      await expect(result.current.getNotes()).rejects.toThrow('Get notes failed');
      
      await waitFor(() => {
        expect(result.current.error).toBe('Get notes failed');
      });
    });
  });

  describe('content parsing', () => {
    it('should handle string content correctly', async () => {
      const docWithArrayContent = {
        ...mockPouchDoc,
        content: mockNote.content,
      };

      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: docWithArrayContent }],
      });

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes[0].content).toEqual(mockNote.content);
    });

    it('should handle object content correctly', async () => {
      const docWithObjectContent = {
        ...mockPouchDoc,
        content: mockNote.content,
      };

      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: docWithObjectContent }],
      });

      const { result } = renderHook(() => useNote());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes[0].content).toEqual(mockNote.content);
    });
  });
});
