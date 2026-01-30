import { useState, useEffect } from "react";
import { useTask } from "../task/use-task";
import type { Task } from "~/lib/types/task";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as Task;

    try {
      setIsSubmitting(true);

      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, {
          name: taskData.name.trim(),
        });
      } else {
        result = await createTask({
          name: taskData.name.trim(),
        });
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
        </div>
      </div>
    </BaseForm>
  );
}
