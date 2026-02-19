import { useState, useEffect } from "react";
import type { TrackerAttribute } from "./trackerAttributeStore";
import { useTrackerAttribute } from "./use-tracker-attribute";
import { useTrackers } from "../tracker/use-trackers";
import BaseForm from "src/ui/base-form";
import { FormInput } from "src/ui/form-input";

interface TrackerAttributeFormProps {
  trackerAttributeId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TrackerAttributeForm({
  trackerAttributeId,
  onSuccess,
  onError,
  onCancel,
}: TrackerAttributeFormProps) {
  const {
    loading,
    error,
    createTrackerAttribute,
    updateTrackerAttribute,
    getTrackerAttribute,
    trackerAttribute,
  } = useTrackerAttribute(trackerAttributeId || undefined);
  const { trackers } = useTrackers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (form: FormData) => {
    try {
      setIsSubmitting(true);

      const name = form.get("name") as string;
      const type = form.get("type") as
        | "text"
        | "number"
        | "boolean"
        | "date"
        | "options";
      const required = form.get("required") === "on";
      const defaultValue = form.get("defaultValue") as string;
      const description = form.get("description") as string;
      const trackerId = form.get("trackerId") as string;
      const options = form.get("options") as string;

      if (!name || !type || !trackerId) {
        if (onError) onError("Name, type, and tracker are required");
        return;
      }

      let processedDefaultValue: string | number | boolean | undefined;
      let processedOptions: string[] | undefined;

      if (defaultValue) {
        switch (type) {
          case "number":
            processedDefaultValue = parseFloat(defaultValue) || 0;
            break;
          case "boolean":
            processedDefaultValue = defaultValue === "true";
            break;
          default:
            processedDefaultValue = defaultValue;
        }
      }

      if (type === "options" && options) {
        processedOptions = options
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      }

      if (trackerAttributeId && trackerAttribute) {
        await updateTrackerAttribute(trackerAttribute.id, {
          name,
          type,
          required,
          defaultValue: processedDefaultValue,
          description: description || undefined,
          trackerId,
          options: processedOptions,
        });
      } else {
        await createTrackerAttribute({
          name,
          type,
          required,
          defaultValue: processedDefaultValue,
          description: description || undefined,
          trackerId,
          options: processedOptions,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <BaseForm
      title={
        trackerAttributeId ? "Edit Tracker Attribute" : "New Tracker Attribute"
      }
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      <div
        className="
        flex-1
        overflow-y-auto
        scroll-area
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
          <div className="space-y-2">
            <FormInput
              name="name"
              label="Name"
              value={trackerAttribute?.name || ""}
              placeholder="Enter attribute name"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                key={Math.random()}
                name="type"
                defaultValue={trackerAttribute?.type || "text"}
                disabled={isSubmitting}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="options">Options</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="required"
                defaultChecked={trackerAttribute?.required || false}
                disabled={isSubmitting}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Required
              </label>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tracker *
              </label>
              <select
                key={Math.random()}
                name="trackerId"
                defaultValue={trackerAttribute?.trackerId || ""}
                disabled={isSubmitting}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>
                  Select a tracker
                </option>
                {trackers.map((tracker) => (
                  <option key={tracker.id} value={tracker.id}>
                    {tracker.name}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              name="defaultValue"
              label="Default Value"
              value={trackerAttribute?.defaultValue?.toString() || ""}
              placeholder="Enter default value (optional)"
              disabled={isSubmitting}
              required={false}
              className="text-base"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options (comma-separated)
              </label>
              <textarea
                name="options"
                defaultValue={trackerAttribute?.options?.join(", ") || ""}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter options separated by commas (e.g., Option 1, Option 2, Option 3)"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={trackerAttribute?.description || ""}
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter attribute description (optional)"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
