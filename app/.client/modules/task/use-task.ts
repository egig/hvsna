import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "../../../lib/types/task";
import { useEffect, useState } from "react";
import { usePouchDB } from "../../pouchdb";
import { useTaskStore } from "./task-store";
import { useLog } from "../journal/use-log";
import { useTarget } from "../target/use-target";

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

export const useTask = (taskId?: string): UseTaskReturn => {
  const { db } = usePouchDB();
  const store = useTaskStore();
  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  
  // Use the useTarget hook when we have a targetId
  const { target: currentTarget, getTarget } = useTarget(currentTargetId || '');

  useEffect(() => {
    if (taskId) {
      store.getTask(taskId, db).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask);
          // Update targetId if task has one
          if (fetchedTask.targetId !== currentTargetId) {
            setCurrentTargetId(fetchedTask.targetId || null);
          }
        }
      });
    }
  }, [taskId, currentTargetId]);

  const updateTaskWithLog = async (id: string, input: TaskUpdateInput): Promise<Task> => {

    // Get the current task before updating to check status change
    const currentTask = await store.getTask(id, db);
    
    // Update the task
    const updatedTask = await store.updateTask(id, input, db);

    if (!input.targetId) {
      return updatedTask
    }
    
    // Create log if status changed
    if (input.status !== undefined && currentTask && input.status !== currentTask.status) {
      try {
        let trackerId = id; // Default to task ID
        
        // If task has a targetId, get the target and use its trackerId
        if (updatedTask.targetId) {
          try {
            const target = await getTarget(updatedTask.targetId);
            trackerId = target.trackerId;
          } catch (targetError) {
            // If target not found, fall back to task ID
            console.warn('Target not found for task, using task ID as tracker ID:', targetError);
          }
        }
        
        await createLog({
          trackerId: trackerId,
          timestamp: Date.now(),
          value: updatedTask.targetValue as number, // 1 for completed, 0 for re-opened
          metadata: {
            taskName: updatedTask.name,
            previousStatus: currentTask.status,
            newStatus: input.status,
            targetValue: updatedTask.targetValue,
            reversedValue: input.status === 'completed' ? undefined : -1 // Mark as reversed when re-opened
          }
        });
      } catch (logError) {
        // Log creation failure shouldn't break task update
        console.warn('Failed to create log for task status change:', logError);
      }
    }
    
    return updatedTask;
  };

  return {
    task,
    loading: store.loading,
    error: store.error,
    createTask: (input: TaskCreateInput) => store.createTask(input, db),
    updateTask: updateTaskWithLog,
    deleteTask: (id: string) => store.deleteTask(id, db),
    getTask: (id: string) => store.getTask(id, db),
    reset: () => setTask(null),
  };
};
