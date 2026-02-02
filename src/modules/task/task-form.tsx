import { useState, useEffect } from "react";
import { useTask } from "./use-task";
import { useTargetStore } from "../target/targetStore";
import { usePouchDB } from "../../pouchdb";
import type { Task } from "src/lib/types/task";
import type { Target } from "../target/targetStore";
import type { TrackerAttribute } from "../attribute/trackerAttributeStore";
import { Check } from "lucide-react";
import { Navbar } from "../navigation";
import { useTargets } from "../target/use-targets";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import CustomAttributeInput from "src/components/custom-attribute-input";
import BaseForm from "src/components/base-form";
import { FormInput } from "src/components/form-input";

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
  const { targets } = useTargets();
  const { db } = usePouchDB();
  const { getTargetsFromDB } = useTargetStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    task?.targetId as string,
  );
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const { trackerAttributes } = useTrackerAttributes(selectedTarget?.trackerId);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    setSelectedTargetId(task?.targetId || "");
  }, [task]);

  useEffect(() => {
    const target = targets.find((t) => t.id === selectedTargetId);
    setSelectedTarget(target || null);
  }, [selectedTargetId, targets]);

  // Helper function to get attribute by ID
  const getAttributeById = (
    attributeId: string,
  ): TrackerAttribute | undefined => {
    return trackerAttributes.find((attr) => attr.id === attributeId);
  };

  // Helper function to render attribute input using CustomAttributeInput
  const renderAttributeInput = (attribute: TrackerAttribute, index: number) => {
    const value = task?.attributes?.[attribute.id];

    return (
      <CustomAttributeInput
        key={attribute.id}
        attr={attribute}
        value={value}
        disabled={isSubmitting}
      />
    );
  };

  const handleSubmit = async (formData: FormData) => {
    const taskData = Object.fromEntries(formData) as unknown as Task;

    try {
      setIsSubmitting(true);

      // Extract scope values from form data
      var attr: Record<string, any> = {};
      if (selectedTarget?.scope) {
        for (let i = 0; i < selectedTarget.scope.length; i++) {
          const attributeId = selectedTarget.scope[i];
          let value = formData.get(attributeId) as string;
          attr[attributeId] = value;
        }
      }

      console.log("attr", attr, selectedTarget);

      const taskInput: any = {
        name: taskData.name.trim(),
        targetId: taskData.targetId,
        targetValue: taskData.targetValue,
        attributes: attr,
      };

      if (selectedTargetId) {
        taskInput.targetId = selectedTargetId;
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
              // HACK to set this re-render
              key={Math.random()}
              defaultValue={selectedTargetId}
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
            <>
              <FormInput
                name="targetValue"
                label="Target Value"
                value={task?.targetValue?.toString() || ""}
                placeholder="Enter target value"
                type="number"
                disabled={isSubmitting}
                required={false}
                className="text-base"
              />

              {selectedTarget?.scope?.map((attributeId, index) => {
                const attribute = getAttributeById(attributeId);
                if (!attribute) {
                  // Fallback to basic text input if attribute not found
                  return (
                    <FormInput
                      key={`scope-${index}`}
                      name={`scope_${index}`}
                      label={`Scope: ${attributeId}`}
                      value={task?.attributes?.[index]?.toString() || ""}
                      placeholder={`Enter value for ${attributeId}`}
                      type="text"
                      disabled={isSubmitting}
                      required={false}
                      className="text-base"
                    />
                  );
                }

                return renderAttributeInput(attribute, index);
              })}
            </>
          )}
        </div>
      </div>
    </BaseForm>
  );
}
