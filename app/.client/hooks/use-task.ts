import { useState, useCallback } from 'react';
import type { Task, TaskCreateInput, TaskUpdateInput, TaskStatus } from '../../lib/types/task';
import { usePouchDB } from '../contexts/PouchDB';

interface PouchDBTaskDocument {
  _id: string;
  _rev?: string;
  user_id: string;
  name: string;
  status: TaskStatus;
  scheduledAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseTaskReturn {
  task: Task | null;
  loading: boolean;
  error: string | null;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  reset: () => void;
}

export const useTask = (): UseTaskReturn => {
  const { db } = usePouchDB();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (input: TaskCreateInput): Promise<Task> => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date().toISOString();
      const taskId = input.id || `task_${crypto.randomUUID()}`;
      
      const newTask: Task = {
        id: taskId,
        user_id: 'default-user', // You might want to get this from auth context
        name: input.name,
        status: input.status || 'pending',
        scheduledAt: input.scheduledAt,
        created_at: now,
        updated_at: now,
      };

      const doc: PouchDBTaskDocument = {
        _id: taskId,
        user_id: newTask.user_id,
        name: newTask.name,
        status: newTask.status,
        scheduledAt: newTask.scheduledAt,
        created_at: newTask.created_at,
        updated_at: newTask.updated_at,
      };

      await db.put(doc);
      setTask(newTask);
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const updateTask = useCallback(async (id: string, input: TaskUpdateInput): Promise<Task> => {
    try {
      setLoading(true);
      setError(null);
      
      const existingDoc: PouchDBTaskDocument = await db.get(id);
      
      const updateData: PouchDBTaskDocument = {
        ...existingDoc,
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.scheduledAt !== undefined) {
        updateData.scheduledAt = input.scheduledAt;
      }

      const response = await db.put(updateData);
      const updatedDoc: PouchDBTaskDocument = {
        ...updateData,
        _rev: response.rev,
      };
      
      const updatedTask: Task = {
        id: updatedDoc._id,
        user_id: updatedDoc.user_id,
        name: updatedDoc.name,
        status: updatedDoc.status,
        scheduledAt: updatedDoc.scheduledAt,
        created_at: updatedDoc.created_at,
        updated_at: updatedDoc.updated_at,
      };

      setTask(updatedTask);
      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const doc: PouchDBTaskDocument = await db.get(id);
      // Ensure _rev is present before removing
      if (!doc._rev) {
        throw new Error('Document revision is required for deletion');
      }
      await db.remove(doc as any);
      
      // Clear the current task if it matches the deleted task
      if (task && task.id === id) {
        setTask(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [db, task]);

  const getTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const doc: PouchDBTaskDocument = await db.get(id);
      const retrievedTask: Task = {
        id: doc._id,
        user_id: doc.user_id,
        name: doc.name,
        status: doc.status,
        scheduledAt: doc.scheduledAt,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };
      
      setTask(retrievedTask);
      return retrievedTask;
    } catch (err) {
      if ((err as any).status === 404) {
        setTask(null);
        return null;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to get task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const reset = useCallback(() => {
    setTask(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    task,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    reset,
  };
};
