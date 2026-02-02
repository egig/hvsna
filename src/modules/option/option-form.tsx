import { useState, useEffect } from "react";
import type { AttributeOption } from "./optionStore";
import { useAttributeOption } from "./use-option";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { useTrackers } from "../tracker/use-trackers";
import BaseForm from "src/components/base-form";
import { FormInput } from "src/components/form-input";

interface AttributeOptionFormProps {
  attributeOptionId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function AttributeOptionForm({
  attributeOptionId,
  onSuccess,
  onError,
  onCancel,
}: AttributeOptionFormProps) {
  const {
    loading,
    error,
    createAttributeOption,
    updateAttributeOption,
    getAttributeOption,
    attributeOption,
  } = useAttributeOption(attributeOptionId || undefined);
  const { trackers } = useTrackers();
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>("");
  const { trackerAttributes } = useTrackerAttributes(selectedTrackerId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    // Pre-select tracker when editing
    if (attributeOption && trackerAttributes.length > 0) {
      const attribute = trackerAttributes.find(
        (attr) => attr.id === attributeOption.attributeId,
      );
      if (attribute && attribute.trackerId !== selectedTrackerId) {
        setSelectedTrackerId(attribute.trackerId);
      }
    }
  }, [attributeOption, trackerAttributes, selectedTrackerId]);

  const handleTrackerChange = (trackerId: string) => {
    setSelectedTrackerId(trackerId);
  };

  const handleSubmit = async (form: FormData) => {
    try {
      setIsSubmitting(true);

      const name = form.get("name") as string;
      const trackerId = form.get("trackerId") as string;
      const attributeId = form.get("attributeId") as string;

      if (!name || !trackerId || !attributeId) {
        if (onError) onError("Name, tracker, and attribute are required");
        return;
      }

      if (attributeOptionId && attributeOption) {
        await updateAttributeOption(attributeOption.id, {
          name,
          attributeId,
        });
      } else {
        await createAttributeOption({
          name,
          attributeId,
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
        attributeOptionId ? "Edit Attribute Option" : "New Attribute Option"
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
              value={attributeOption?.name || ""}
              placeholder="Enter option name"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tracker *
              </label>
              <select
                name="trackerId"
                value={selectedTrackerId}
                onChange={(e) => handleTrackerChange(e.target.value)}
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

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Attribute *
              </label>
              <select
                // HACK to force re-render
                key={Math.random()}
                name="attributeId"
                defaultValue={attributeOption?.attributeId || ""}
                disabled={isSubmitting || !selectedTrackerId}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {selectedTrackerId
                    ? "Select an attribute"
                    : "Select a tracker first"}
                </option>
                {trackerAttributes.map((attribute) => (
                  <option key={attribute.id} value={attribute.id}>
                    {attribute.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
