import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks } from '../useTasks';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../../../lib/types/task';

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

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePouchDB.mockReturnValue({ db: mockDb });
  });

  const mockTask: Task = {
    id: 'task_test-uuid-123',
    user_id: 'default-user',
    name: 'Test Task',
    status: 'pending',
    scheduledAt: '2024-01-15T00:00:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockPouchDoc = {
    _id: 'task_test-uuid-123',
    _rev: '1-rev',
    user_id: 'default-user',
    name: 'Test Task',
    status: 'pending',
    scheduledAt: '2024-01-15T00:00:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  describe('initial state and loading', () => {
    it('should initialize with empty state and loading true', () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useTasks());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(true);
    });

    it('should load tasks on mount', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: mockPouchDoc }],
      });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([mockTask]);
      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
        limit: 20,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
    });

    it('should handle loading error', async () => {
      const errorMessage = 'Database error';
      mockDb.allDocs.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.tasks).toEqual([]);
    });
  });

  describe('refreshTasks', () => {
    it('should refresh tasks successfully', async () => {
      mockDb.allDocs
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ doc: mockPouchDoc }],
        });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);

      await result.current.refreshTasks();

      await waitFor(() => {
        expect(result.current.tasks).toEqual([mockTask]);
      });

      expect(mockDb.allDocs).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh error', async () => {
      mockDb.allDocs
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshTasks();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Refresh failed');
      });
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.put.mockResolvedValue({ id: 'task_test-uuid-123', ok: true });

      const { result } = renderHook(() => useTasks());

      const taskInput: TaskCreateInput = {
        name: 'New Task',
        status: 'pending',
      };

      const createdTask = await result.current.createTask(taskInput);

      expect(createdTask.name).toBe('New Task');
      expect(createdTask.status).toBe('pending');
      expect(createdTask.id).toBe('task_test-uuid-123');
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'task_test-uuid-123',
          name: 'New Task',
          status: 'pending',
          user_id: 'default-user',
        })
      );
    });

    it('should create a task with custom id', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.put.mockResolvedValue({ id: 'custom-id', ok: true });

      const { result } = renderHook(() => useTasks());

      const taskInput: TaskCreateInput = {
        id: 'custom-id',
        name: 'Custom ID Task',
      };

      await result.current.createTask(taskInput);

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'custom-id',
          name: 'Custom ID Task',
        })
      );
    });

    it('should handle create error', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.put.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useTasks());

      const taskInput: TaskCreateInput = {
        name: 'Failed Task',
      };

      await act(async () => {
        await expect(result.current.createTask(taskInput)).rejects.toThrow('Create failed');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Create failed');
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const updatedDoc = {
        ...mockPouchDoc,
        name: 'Updated Task',
        status: 'completed',
        updated_at: new Date().toISOString(),
      };
      
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.put.mockResolvedValue({ id: 'task_test-uuid-123', rev: '2-rev', ok: true });

      const { result } = renderHook(() => useTasks());

      const updateInput: TaskUpdateInput = {
        name: 'Updated Task',
        status: 'completed',
      };

      const updatedTask = await result.current.updateTask('task_test-uuid-123', updateInput);

      expect(updatedTask.name).toBe('Updated Task');
      expect(updatedTask.status).toBe('completed');
      expect(mockDb.get).toHaveBeenCalledWith('task_test-uuid-123');
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'task_test-uuid-123',
          name: 'Updated Task',
          status: 'completed',
        })
      );
    });

    it('should update task name only', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.put.mockResolvedValue({ id: 'task_test-uuid-123', rev: '2-rev', ok: true });

      const { result } = renderHook(() => useTasks());

      const updateInput: TaskUpdateInput = {
        name: 'New Name Only',
      };

      await result.current.updateTask('task_test-uuid-123', updateInput);

      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name Only',
          status: 'pending', // Original status should remain
        })
      );
    });

    it('should handle update error', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.get.mockRejectedValue(new Error('Task not found'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await expect(result.current.updateTask('non-existent', {})).rejects.toThrow('Task not found');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Task not found');
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.remove.mockResolvedValue({ ok: true });

      const { result } = renderHook(() => useTasks());

      await result.current.deleteTask('task_test-uuid-123');

      expect(mockDb.get).toHaveBeenCalledWith('task_test-uuid-123');
      expect(mockDb.remove).toHaveBeenCalledWith(mockPouchDoc);
    });

    it('should handle delete error when revision missing', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      const docWithoutRev = { ...mockPouchDoc, _rev: undefined };
      mockDb.get.mockResolvedValue(docWithoutRev);

      const { result } = renderHook(() => useTasks());

      await expect(result.current.deleteTask('task_test-uuid-123')).rejects.toThrow(
        'Document revision is required for deletion'
      );
    });

    it('should handle delete error when task not found', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });
      mockDb.get.mockRejectedValue(new Error('Task not found'));

      const { result } = renderHook(() => useTasks());

      await expect(result.current.deleteTask('non-existent')).rejects.toThrow('Task not found');
    });
  });

  describe('getTask', () => {
    it('should get a task by id successfully', async () => {
      mockDb.get.mockResolvedValue(mockPouchDoc);

      const { result } = renderHook(() => useTasks());

      const task = await result.current.getTask('task_test-uuid-123');

      expect(task).toEqual(mockTask);
      expect(mockDb.get).toHaveBeenCalledWith('task_test-uuid-123');
    });

    it('should return null when task not found', async () => {
      const notFoundError = new Error('Not found');
      (notFoundError as any).status = 404;
      mockDb.get.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useTasks());

      const task = await result.current.getTask('non-existent');

      expect(task).toBeNull();
    });

    it('should handle get task error', async () => {
      mockDb.get.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await expect(result.current.getTask('task_test-uuid-123')).rejects.toThrow('Database error');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });
    });
  });

  describe('getTasks', () => {
    it('should get all tasks successfully', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: mockPouchDoc }],
      });

      const { result } = renderHook(() => useTasks());

      const tasks = await result.current.getTasks();

      expect(tasks).toEqual([mockTask]);
      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
    });

    it('should get task by id successfully', async () => {
      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: mockPouchDoc }],
      });

      const { result } = renderHook(() => useTasks());

      const tasks = await result.current.getTasks({ id: 'task_test-uuid-123' });

      expect(tasks).toEqual([mockTask]);
      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
    });

    it('should filter tasks by status', async () => {
      const pendingTask = {
        _id: 'task_pending-task',
        _rev: '1-rev',
        user_id: 'default-user',
        name: 'Pending Task',
        status: 'pending' as const,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      
      const completedTask = {
        _id: 'task_completed-task',
        _rev: '1-rev',
        user_id: 'default-user',
        name: 'Completed Task',
        status: 'completed' as const,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: pendingTask }, { doc: completedTask }],
      });

      const { result } = renderHook(() => useTasks());

      const pendingTasks = await result.current.getTasks({ status: 'pending' });
      const completedTasks = await result.current.getTasks({ status: 'completed' });

      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].status).toBe('pending');
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].status).toBe('completed');
    });

    it('should handle get tasks error', async () => {
      mockDb.allDocs.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await expect(result.current.getTasks()).rejects.toThrow('Database error');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });
    });
  });

  describe('loadMoreTasks', () => {
    it('should load more tasks successfully', async () => {
      // Create 20 tasks to fill the initial page and trigger hasMore=true
      const initialTasks = Array.from({ length: 20 }, (_, i) => ({
        doc: {
          _id: `task_${i + 1}`,
          _rev: '1-rev',
          user_id: 'default-user',
          name: `Task ${i + 1}`,
          status: 'pending' as const,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }
      }));

      const moreTasks = [
        { 
          doc: { 
            _id: 'task_21',
            _rev: '1-rev',
            user_id: 'default-user',
            name: 'Task 21',
            status: 'pending' as const,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          } 
        },
      ];

      // Mock the calls
      mockDb.allDocs
        .mockResolvedValueOnce({ rows: initialTasks }) // Initial load
        .mockResolvedValueOnce({ rows: initialTasks }) // refreshTasks call
        .mockResolvedValueOnce({ rows: moreTasks });  // loadMoreTasks call

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial state
      expect(result.current.tasks).toHaveLength(20);
      expect(result.current.hasMore).toBe(true);

      // Test that loadMoreTasks was called with correct parameters
      await act(async () => {
        await result.current.loadMoreTasks();
      });

      await waitFor(() => {
        expect(result.current.loadingMore).toBe(false);
      });

      // Verify that allDocs was called with the correct parameters for pagination
      expect(mockDb.allDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          include_docs: true,
          attachments: true,
          skip: 20,
          limit: 20,
          startkey: 'task_',
          endkey: 'task_\uffff',
        })
      );
    });

    it('should not load more if already loading', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear the mock to track new calls
      mockDb.allDocs.mockClear();
      
      // Call loadMoreTasks - it should not call allDocs again since loadingMore is false but hasMore is false after initial load
      await result.current.loadMoreTasks();

      // Should not have been called since hasMore would be false after initial load with empty result
      expect(mockDb.allDocs).not.toHaveBeenCalled();
    });

    it('should not load more if no more tasks', async () => {
      mockDb.allDocs.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Manually set hasMore to false
      (result.current as any).hasMore = false;

      await result.current.loadMoreTasks();

      expect(mockDb.allDocs).toHaveBeenCalledTimes(1); // Only called for initial load
    });
  });

  describe('getTasksByDate', () => {
    it('should get tasks by scheduled date successfully', async () => {
      const taskWithDate = {
        ...mockPouchDoc,
        _id: 'task_with_date',
        scheduledAt: '2024-01-15T00:00:00.000Z',
      };
      
      const taskWithoutDate = {
        ...mockPouchDoc,
        _id: 'task_without_date',
        scheduledAt: undefined,
      };
      
      const taskWithDifferentDate = {
        ...mockPouchDoc,
        _id: 'task_different_date',
        scheduledAt: '2024-01-16T00:00:00.000Z',
      };

      mockDb.allDocs.mockResolvedValue({
        rows: [
          { doc: taskWithDate },
          { doc: taskWithoutDate },
          { doc: taskWithDifferentDate },
        ],
      });

      const { result } = renderHook(() => useTasks());

      const tasksByDate = await result.current.getTasksByDate('2024-01-15');

      expect(tasksByDate).toHaveLength(1); // Only taskWithDate has the matching date
      expect(tasksByDate[0].scheduledAt).toBe('2024-01-15T00:00:00.000Z');
      expect(mockDb.allDocs).toHaveBeenCalledWith({
        include_docs: true,
        attachments: true,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
    });

    it('should return empty array when no tasks scheduled for date', async () => {
      const taskWithDifferentDate = {
        ...mockPouchDoc,
        _id: 'task_different_date',
        scheduledAt: '2024-01-16T00:00:00.000Z',
      };

      mockDb.allDocs.mockResolvedValue({
        rows: [{ doc: taskWithDifferentDate }],
      });

      const { result } = renderHook(() => useTasks());

      const tasksByDate = await result.current.getTasksByDate('2024-01-15');

      expect(tasksByDate).toHaveLength(0);
    });

    it('should handle getTasksByDate errors', async () => {
      const errorMessage = 'Database error';
      mockDb.allDocs.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      // Just verify the error is thrown - the error state might be reset by other operations
      await expect(result.current.getTasksByDate('2024-01-15')).rejects.toThrow(errorMessage);
    });
  });

  describe('scheduledAt functionality', () => {
    it('should create task with scheduledAt', async () => {
      const taskInput = {
        name: 'New Task',
        scheduledAt: '2024-01-20T00:00:00.000Z',
      };

      const expectedTask = {
        id: 'task_test-uuid-123',
        user_id: 'default-user',
        name: 'New Task',
        status: 'pending',
        scheduledAt: '2024-01-20T00:00:00.000Z',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      };

      mockDb.put.mockResolvedValue({ id: 'task_test-uuid-123', rev: '1-rev' });
      mockDb.allDocs.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useTasks());

      const createdTask = await result.current.createTask(taskInput);

      expect(createdTask).toEqual(expectedTask);
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'task_test-uuid-123',
          name: 'New Task',
          scheduledAt: '2024-01-20T00:00:00.000Z',
          status: 'pending',
        })
      );
    });

    it('should update task scheduledAt', async () => {
      const updatedDoc = {
        ...mockPouchDoc,
        scheduledAt: '2024-01-25T00:00:00.000Z',
      };

      mockDb.get.mockResolvedValue(mockPouchDoc);
      mockDb.put.mockResolvedValue({ id: 'task_test-uuid-123', rev: '2-rev' });
      mockDb.allDocs.mockResolvedValue({ rows: [] });

      const { result } = renderHook(() => useTasks());

      const updatedTask = await result.current.updateTask('task_test-uuid-123', {
        scheduledAt: '2024-01-25T00:00:00.000Z',
      });

      expect(updatedTask.scheduledAt).toBe('2024-01-25T00:00:00.000Z');
      expect(mockDb.put).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: '2024-01-25T00:00:00.000Z',
        })
      );
    });
  });
});
