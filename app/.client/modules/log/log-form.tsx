import { useState, useEffect, use } from "react";
import { useLog } from "./use-log";
import { useTrackers } from "../tracker/use-trackers";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import { LoadingSpinner } from "~/.client/components/loader";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";
import CustomAttributeInput from "~/.client/components/custom-attribute-input";
import type { Log } from "~/lib/tracker/types";

interface LogFormProps {
  logId?: string | null;
  onSuccess?: (log: Log) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function LogForm({
  logId,
  onSuccess,
  onError,
  onCancel,
}: LogFormProps) {
  const { loading: trackerLoading, trackers } = useTrackers();
  const { loading, error, createLog, updateLog, log } = useLog(
    logId || undefined,
  );
  const [selectedTrackerId, setSelectedTrackerId] = useState(log?.trackerId);
  const { loading: attributesLoading, trackerAttributes } =
    useTrackerAttributes(selectedTrackerId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (logId) {
      setSelectedTrackerId(log?.trackerId);
    }
  }, [logId, log]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (formData: FormData) => {
    const { value, timestamp, negative, note } = Object.fromEntries(
      formData.entries(),
    );

    if (!selectedTrackerId) return;

    try {
      setIsSubmitting(true);

      // Add custom attributes to metadata with 'custom_' prefix
      const customMetadata: Record<string, any> = { ...log?.attributes };
      Object.values(trackerAttributes).forEach((attr) => {
        customMetadata[`${attr.id}`] =
          formData.get(attr.id) || attr.defaultValue;
      });

      let v = parseFloat(value?.toString())
      if (selectedTracker?.type === "counter") {
        v = 1;
      }

      let result: Log;
      const logData = {
        trackerId: selectedTrackerId,
        negative,
        value: v,
        timestamp: new Date().getTime(),
        note: note?.toString() || undefined,
        attributes:
          Object.keys(customMetadata).length > 0 ? customMetadata : undefined,
      };

      if (logId) {
        result = await updateLog(logId, logData);
      } else {
        result = await createLog(logData);
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : "Failed to save log");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedTrackerId("");
    if (onCancel) {
      onCancel();
    }
  };

  const selectedTracker = trackers.find((t) => t.id === selectedTrackerId);

  return (
    <BaseForm
      onSubmit={handleSubmit}
      title={logId ? "Edit Log" : "New Log"}
      onSuccess={handleCancel}
      onError={onError}
      onCancel={handleCancel}
    >
      {(loading || trackerLoading || attributesLoading) && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading log data..." />
        </div>
      )}

      <div className="space-y-5">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tracker
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            key={selectedTrackerId}
            defaultValue={selectedTrackerId}
            onChange={(e) => setSelectedTrackerId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            required
          >
            <option value="">Select a tracker</option>
            {trackers.map((tracker) => (
              <option key={tracker.id} value={tracker.id}>
                {tracker.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTracker && (
          <div className="text-sm text-gray-500 mb-4">
            Tracker: {selectedTracker.name}
          </div>
        )}

        <div className="space-y-5">
          <div className="mb-4">
            <label>
              <input
                key={Math.random()}
                defaultChecked={log ? log.negative : selectedTracker?.negative}
                name="negative"
                type="checkbox"
              />{" "}
              negative
            </label>
          </div>
        </div>

        {selectedTracker?.type === "amount" && (
          <FormInput
            name="value"
            label="Value"
            type="number"
            value={log?.value as unknown as string}
            placeholder="0"
            disabled={isSubmitting}
            required={true}
            className="text-base"
          />
        )}
        {selectedTracker && selectedTracker.type === "amount" && (
          <p className="text-sm text-gray-500 -mt-2 mb-4">
            Value in {selectedTracker.unit}
          </p>
        )}

        {/* Custom Attributes */}
        {trackerAttributes && trackerAttributes.length > 0 && (
          <div className="">
            {trackerAttributes.map((attr) => (
              <CustomAttributeInput
                key={attr.id}
                logId={log?.id}
                attr={attr}
                value={log?.attributes?.[`${attr.id}`]}
                disabled={isSubmitting}
              />
            ))}
          </div>
        )}

        {/* Note Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note
          </label>
          <textarea
            name="note"
            defaultValue={log?.note || ""}
            disabled={isSubmitting}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
            placeholder="Add a note..."
          />
        </div>
      </div>
    </BaseForm>
  );
}
