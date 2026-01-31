import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "../../../lib/types/task";
import { useEffect, useState } from "react";
import { usePouchDB } from "../../pouchdb";
import { useTaskStore } from "./task-store";

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
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    if (taskId) {
      store.getTask(taskId, db).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask)
        }
      });
    }
  }, [taskId]);

  return {
    task,
    loading: store.loading,
    error: store.error,
    createTask: (input: TaskCreateInput) => store.createTask(input, db),
    updateTask: (id: string, input: TaskUpdateInput) =>
      store.updateTask(id, input, db),
    deleteTask: (id: string) => store.deleteTask(id, db),
    getTask: (id: string) => store.getTask(id, db),
    reset: store.reset,
  };
};
