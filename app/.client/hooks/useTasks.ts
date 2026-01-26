import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskCreateInput, TaskUpdateInput, TaskQuery, TaskStatus } from '../../lib/types/task';
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

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  getTasks: (query?: TaskQuery) => Promise<Task[]>;
  getTasksByDate: (date: string) => Promise<Task[]>;
  refreshTasks: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const { db } = usePouchDB();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setOffset(0);
      
      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        limit: PAGE_SIZE,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
      
      const tasksList = result.rows
        .filter((row: any) => row.doc && row.doc._id.startsWith('task_'))
        .map((row: any) => {
          const doc: PouchDBTaskDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            name: doc.name,
            status: doc.status,
            scheduledAt: doc.scheduledAt,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });
      
      setTasks(tasksList);
      setHasMore(result.rows.length >= PAGE_SIZE);
      setOffset(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [db]);

  const loadMoreTasks = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        skip: offset,
        limit: PAGE_SIZE,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
      
      const newTasks = result.rows
        .filter((row: any) => row.doc && row.doc._id.startsWith('task_'))
        .map((row: any) => {
          const doc: PouchDBTaskDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            name: doc.name,
            status: doc.status,
            scheduledAt: doc.scheduledAt,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });
      
      setTasks(prev => [...prev, ...newTasks]);
      setHasMore(result.rows.length >= PAGE_SIZE);
      setOffset(prev => prev + PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more tasks');
    } finally {
      setLoadingMore(false);
    }
  }, [db, loadingMore, hasMore, offset]);

  const createTask = useCallback(async (input: TaskCreateInput): Promise<Task> => {
    try {
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
      await refreshTasks();
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db, refreshTasks]);

  const updateTask = useCallback(async (id: string, input: TaskUpdateInput): Promise<Task> => {
    try {
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
      
      await refreshTasks();
      
      return {
        id: updatedDoc._id,
        user_id: updatedDoc.user_id,
        name: updatedDoc.name,
        status: updatedDoc.status,
        scheduledAt: updatedDoc.scheduledAt,
        created_at: updatedDoc.created_at,
        updated_at: updatedDoc.updated_at,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db, refreshTasks]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      const doc: PouchDBTaskDocument = await db.get(id);
      // Ensure _rev is present before removing
      if (!doc._rev) {
        throw new Error('Document revision is required for deletion');
      }
      await db.remove(doc as any);
      await refreshTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db, refreshTasks]);

  const getTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      const doc: PouchDBTaskDocument = await db.get(id);
      return {
        id: doc._id,
        user_id: doc.user_id,
        name: doc.name,
        status: doc.status,
        scheduledAt: doc.scheduledAt,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };
    } catch (err) {
      if ((err as any).status === 404) {
        return null;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to get task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db]);

  const getTasks = useCallback(async (query?: TaskQuery): Promise<Task[]> => {
    try {
      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
      
      let tasksList = result.rows
        .filter((row: any) => row.doc && row.doc._id.startsWith('task_'))
        .map((row: any) => {
          const doc: PouchDBTaskDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            name: doc.name,
            status: doc.status,
            scheduledAt: doc.scheduledAt,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });

      // Filter by id if provided
      if (query?.id) {
        tasksList = tasksList.filter(task => task.id === query.id);
      }

      // Filter by status if provided
      if (query?.status) {
        tasksList = tasksList.filter(task => task.status === query.status);
      }
      
      return tasksList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tasks';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db]);

  const getTasksByDate = useCallback(async (date: string): Promise<Task[]> => {
    try {
      const result = await db.allDocs({
        include_docs: true,
        attachments: true,
        startkey: 'task_',
        endkey: 'task_\uffff',
      });
      
      const tasksList = result.rows
        .filter((row: any) => row.doc && row.doc._id.startsWith('task_'))
        .map((row: any) => {
          const doc: PouchDBTaskDocument = row.doc;
          return {
            id: doc._id,
            user_id: doc.user_id,
            name: doc.name,
            status: doc.status,
            scheduledAt: doc.scheduledAt,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };
        });

      // Filter by scheduled date
      return tasksList.filter(task => {
        if (!task.scheduledAt) return false;
        
        // Parse the scheduled date and compare with the provided date
        const taskDate = new Date(task.scheduledAt).toISOString().split('T')[0];
        const providedDate = new Date(date).toISOString().split('T')[0];
        
        return taskDate === providedDate;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get tasks by date';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [db]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  return {
    tasks,
    loading,
    loadingMore,
    error,
    hasMore,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTasks,
    getTasksByDate,
    refreshTasks,
    loadMoreTasks,
  };
};
