import { useState, useEffect } from "react";
import { useTask } from "../task/use-task";
import { useTargetStore } from "../target/targetStore";
import { usePouchDB } from "../../pouchdb";
import type { Task } from "~/lib/types/task";
import type { Target } from "../target/targetStore";
import { Check } from "lucide-react";
import { Navbar } from "../navigation";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";

interface TaskFormProps {
  taskId?: string | null;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TaskForm({
  taskId,
  onSuccess,
  onError,
  onCancel,
}: TaskFormProps) {
  const { task, loading, error, createTask, updateTask, getTask, reset } =
    useTask(taskId as string);
  const { db } = usePouchDB();
  const { getTargetsFromDB } = useTargetStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [targetValue, setTargetValue] = useState<string>("");

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    const loadTargets = async () => {
      if (db) {
        try {
          const targetsList = await getTargetsFromDB({}, db);
          setTargets(targetsList);
        } catch (err) {
          console.error("Failed to load targets:", err);
        }
      }
    };
    loadTargets();
  }, [db, getTargetsFromDB]);

  useEffect(() => {
    if (task) {
      setSelectedTargetId(task.targetId || "");
      setTargetValue(task.targetValue?.toString() || "");
    } else {
      setSelectedTargetId("");
      setTargetValue("");
    }
  }, [task]);

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as Task;

    try {
      setIsSubmitting(true);

      const taskInput: any = {
        name: taskData.name.trim(),
      };

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
      }

      if (targetValue) {
        taskInput.targetValue = parseFloat(targetValue);
      }

      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, taskInput);
      } else {
        result = await createTask(taskInput);
      }

      reset();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseForm title={taskId ? "Edit Task" : "New Task"} onSubmit={handleSubmit}>
      <div
        className="
        flex-1
        overflow-y-auto
        scroll-area
        bg-gray-50
        safe-top
        safe-bottom
        safe-x
        mb-12
      "
      >
        <div
          className="
          max-w-lg
          mx-auto
          w-full
          py-4
          px-4
        "
        >
          <FormInput
            name="name"
            label="Task Name"
            value={task ? task.name : ""}
            placeholder="Enter task name"
            disabled={isSubmitting}
            required={true}
            className="text-base"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target (Optional)
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a target</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTargetId && (
            <FormInput
              name="targetValue"
              label="Target Value"
              value={targetValue}
              onChange={setTargetValue}
              placeholder="Enter target value"
              type="number"
              disabled={isSubmitting}
              required={false}
              className="text-base"
            />
          )}
        </div>
      </div>
    </BaseForm>
  );
}
