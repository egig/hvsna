import { useState, useEffect, use } from "react";
import { useLog } from "./use-log";
import { useTrackers } from "../tracker/use-trackers";
import { useTrackerAttributes } from "../tracker_attribute/use-tracker-attributes";
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
  const { loading, error, createLog, updateLog, log } = useLog(logId || undefined);
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
    const { value, timestamp } = Object.fromEntries(formData.entries());

    if (!selectedTrackerId) return;

    try {
      setIsSubmitting(true);

      // Add custom attributes to metadata with 'custom_' prefix
      const customMetadata: Record<string, any> = { ...log?.attributes };
      Object.values(trackerAttributes).forEach((attr) => {
        customMetadata[`custom_${attr.id}`] =
          formData.get(attr.id) || attr.defaultValue;
      });

      let result: Log;
      const logData = {
        trackerId: selectedTrackerId,
        value: parseFloat(value?.toString()) || 0,
        timestamp: new Date().getTime(),
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
                    {tracker.name} ({tracker.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedTracker && (
              <div className="text-sm text-gray-500 mb-4">
                Tracker: {selectedTracker.name} ({selectedTracker.unit})
              </div>
            )}

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
            {selectedTracker && (
              <p className="text-sm text-gray-500 -mt-2 mb-4">
                Value in {selectedTracker.unit}
              </p>
            )}

            {/* Custom Attributes */}
            {trackerAttributes && trackerAttributes.length > 0 && (
              <div className="space-y-4 mb-4 border-1 border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700">
                  Custom Attributes
                </h3>
                {trackerAttributes.map((attr) => (
                  <CustomAttributeInput
                    key={attr.id}
                    logId={log?.id}
                    attr={attr}
                    value={log?.attributes?.[`custom_${attr.id}`]}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
