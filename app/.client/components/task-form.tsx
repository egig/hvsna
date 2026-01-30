import { useState, useEffect } from "react";
import { useTask } from "../hooks/use-task";
import type { Task } from "~/lib/types/task";
import { FormInput } from "./form-input";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { LoadingSpinner } from "./loading";
import { Button, Page, Navbar } from "../navigation/components";
import { Check } from "lucide-react";

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
  console.log(taskId);

  const { task, loading, error, createTask, updateTask, getTask, reset } =
    useTask(taskId as string);
  const [taskName, setTaskName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    try {
      setIsSubmitting(true);

      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, {
          name: taskName.trim(),
        });
      } else {
        result = await createTask({
          name: taskName.trim(),
        });
      }

      setTaskName("");
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

  console.log("rendering", task?.name);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Navbar
        title={taskId ? "Edit Task" : "New Task"}
        showBackButton={true}
        customBackAction={onCancel}
        rightAction={
          <button>
            <Check />
          </button>
        }
      />

      <div
        className="
        flex-1
        overflow-y-auto
        scroll-area
        bg-gray-50
        safe-top
        safe-bottom
        safe-x
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
            label="Task Name"
            value={task ? task.name : ""}
            placeholder="Enter task name"
            disabled={isSubmitting}
            required={true}
            onChange={(v) => {
              console.log(v);
              setTaskName(v);
            }}
            className="text-base"
          />
        </div>
      </div>
    </form>
  );
}
