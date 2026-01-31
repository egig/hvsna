import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTask } from '../use-task';
import { useTaskStore } from '../task-store';
import { usePouchDB } from '../../../pouchdb';
import { useLog } from '../../journal/use-log';

// Mock the PouchDB hook
vi.mock('../../../pouchdb', () => ({
  usePouchDB: vi.fn(),
}));

// Mock the useLog hook
vi.mock('../../journal/use-log', () => ({
  useLog: vi.fn(),
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-1234'),
});

describe('useTask - Log Creation on Status Change (Hook Level)', () => {
  const mockDb = {
    get: vi.fn(),
    put: vi.fn(),
    remove: vi.fn(),
    allDocs: vi.fn(),
  };

  const mockCreateLog = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePouchDB as any).mockReturnValue({ db: mockDb });
    (useLog as any).mockReturnValue({ createLog: mockCreateLog });
    
    // Reset store state
    useTaskStore.getState().reset();
  });

  it('should create a log when task status changes to completed', async () => {
    const taskId = 'task_test-uuid-1234';
    const existingTask = {
      _id: taskId,
      _rev: '1-rev',
      user_id: 'default-user',
      name: 'Test Task',
      status: 'pending',
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    const updatedTask = {
      id: taskId,
      user_id: 'default-user',
      name: 'Test Task',
      status: 'completed',
      created_at: Date.now() - 1000,
      updated_at: Date.now(),
    };

    mockDb.get.mockResolvedValue(existingTask);
    mockDb.put.mockResolvedValue({ rev: '2-rev' });
    mockCreateLog.mockResolvedValue({ id: 'log_test-uuid-1234' });

    const { result } = renderHook(() => useTask(taskId));

    const updated = await result.current.updateTask(taskId, { status: 'completed' });
    expect(updated.status).toBe('completed');

    // Verify task update was called
    expect(mockDb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: taskId,
        status: 'completed',
      })
    );

    // Verify log creation was called
    expect(mockCreateLog).toHaveBeenCalledTimes(1);
    expect(mockCreateLog).toHaveBeenCalledWith({
      trackerId: taskId,
      timestamp: expect.any(Number),
      value: 1, // 1 for completed
      metadata: {
        taskName: 'Test Task',
        previousStatus: 'pending',
        newStatus: 'completed',
        targetValue: undefined,
        reversedValue: undefined,
      }
    });
  });

  it('should create a log with reversed value when task is re-opened', async () => {
    const taskId = 'task_test-uuid-1234';
    const existingTask = {
      _id: taskId,
      _rev: '1-rev',
      user_id: 'default-user',
      name: 'Test Task',
      status: 'completed',
      targetValue: 100,
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    const updatedTask = {
      id: taskId,
      user_id: 'default-user',
      name: 'Test Task',
      status: 'pending',
      targetValue: 100,
      created_at: Date.now() - 1000,
      updated_at: Date.now(),
    };

    mockDb.get.mockResolvedValue(existingTask);
    mockDb.put.mockResolvedValue({ rev: '2-rev' });
    mockCreateLog.mockResolvedValue({ id: 'log_test-uuid-1234' });

    const { result } = renderHook(() => useTask(taskId));

    const updated = await result.current.updateTask(taskId, { status: 'pending' });
    expect(updated.status).toBe('pending');

    // Verify log creation was called
    expect(mockCreateLog).toHaveBeenCalledTimes(1);
    expect(mockCreateLog).toHaveBeenCalledWith({
      trackerId: taskId,
      timestamp: expect.any(Number),
      value: 0, // 0 for re-opened
      metadata: {
        taskName: 'Test Task',
        previousStatus: 'completed',
        newStatus: 'pending',
        targetValue: 100,
        reversedValue: -1, // Mark as reversed when re-opened
      }
    });
  });

  it('should not create a log when status does not change', async () => {
    const taskId = 'task_test-uuid-1234';
    const existingTask = {
      _id: taskId,
      _rev: '1-rev',
      user_id: 'default-user',
      name: 'Test Task',
      status: 'pending',
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValue(existingTask);
    mockDb.put.mockResolvedValue({ rev: '2-rev' });

    const { result } = renderHook(() => useTask(taskId));

    const updated = await result.current.updateTask(taskId, { name: 'Updated Task' });
    expect(updated.name).toBe('Updated Task');

    // Verify log creation was not called
    expect(mockCreateLog).not.toHaveBeenCalled();
  });

  it('should not create a log when status is the same as existing', async () => {
    const taskId = 'task_test-uuid-1234';
    const existingTask = {
      _id: taskId,
      _rev: '1-rev',
      user_id: 'default-user',
      name: 'Test Task',
      status: 'pending',
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValue(existingTask);
    mockDb.put.mockResolvedValue({ rev: '2-rev' });

    const { result } = renderHook(() => useTask(taskId));

    const updated = await result.current.updateTask(taskId, { status: 'pending' });
    expect(updated.status).toBe('pending');

    // Verify log creation was not called
    expect(mockCreateLog).not.toHaveBeenCalled();
  });

  it('should handle log creation failure gracefully', async () => {
    const taskId = 'task_test-uuid-1234';
    const existingTask = {
      _id: taskId,
      _rev: '1-rev',
      user_id: 'default-user',
      name: 'Test Task',
      status: 'pending',
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000,
    };

    mockDb.get.mockResolvedValue(existingTask);
    mockDb.put.mockResolvedValue({ rev: '2-rev' });
    mockCreateLog.mockRejectedValue(new Error('Log creation failed'));

    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useTask(taskId));

    const updated = await result.current.updateTask(taskId, { status: 'completed' });
    expect(updated.status).toBe('completed');

    // Verify task update still succeeded
    expect(mockDb.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: taskId,
        status: 'completed',
      })
    );

    // Verify log creation was attempted
    expect(mockCreateLog).toHaveBeenCalledTimes(1);

    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create log for task status change:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
