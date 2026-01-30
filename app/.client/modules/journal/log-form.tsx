import { useState, useEffect } from "react";
import { useLog } from "./use-log";
import type { Tracker, Log, TrackerAttribute } from "~/lib/tracker/types";
import { Button, Page, Navbar } from "../navigation";
import { useTrackers } from "../tracker/use-trackers";
import { LoadingSpinner } from "~/.client/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "~/.client/components/Card";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";

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
  const { loading: trackerLoading, getTrackers } = useTrackers();
  const { loading, error, createLog, updateLog, getLog, log } = useLog();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState("");
  const [value, setValue] = useState("0");
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [metadata, setMetadata] = useState("");
  const [customAttributeValues, setCustomAttributeValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load available trackers
    getTrackers()
      .then(setTrackers)
      .catch(() => {
        // Handle error silently
      });
  }, [getTrackers]);


  // Reset custom attributes when tracker changes
  useEffect(() => {
    const selectedTracker = trackers.find(t => t.id === selectedTrackerId);
    if (selectedTracker?.customAttributes) {
      const newValues: Record<string, any> = {};
      selectedTracker.customAttributes.forEach(attr => {
        newValues[attr.id] = attr.defaultValue || (attr.type === 'number' ? 0 : '');
      });
      setCustomAttributeValues(newValues);
    } else {
      setCustomAttributeValues({});
    }
  }, [selectedTrackerId, trackers]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!selectedTrackerId || !value.trim()) return;

    try {
      setIsSubmitting(true);

      // Merge custom attributes with existing metadata
      let parsedMetadata: Record<string, any> = {};
      if (metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch (e) {
          // If metadata is invalid JSON, treat as empty object
        }
      }

      // Add custom attributes to metadata with 'custom_' prefix
      const customMetadata: Record<string, any> = { ...parsedMetadata };
      Object.keys(customAttributeValues).forEach(attrId => {
        customMetadata[`custom_${attrId}`] = customAttributeValues[attrId];
      });

      let result: Log;
      const logData = {
        trackerId: selectedTrackerId,
        value: parseFloat(value) || 0,
        timestamp: new Date(timestamp).getTime(),
        metadata: Object.keys(customMetadata).length > 0 ? customMetadata : undefined,
      };

      if (logId) {
        result = await updateLog(logId, logData);
      } else {
        result = await createLog(logData);
      }

      // Reset form
      setSelectedTrackerId("");
      setValue("0");
      setTimestamp(new Date().toISOString().slice(0, 16));
      setMetadata("");
      setCustomAttributeValues({});

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
    setValue("0");
    setTimestamp(new Date().toISOString().slice(0, 16));
    setMetadata("");
    setCustomAttributeValues({});
    if (onCancel) {
      onCancel();
    }
  };

  const selectedTracker = trackers.find((t) => t.id === selectedTrackerId);

  return (
    <BaseForm onSubmit={handleSubmit} title={logId ? "Edit Log" : "New Log"} onSuccess={handleCancel} onError={onError} onCancel={handleCancel}>
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
              {(loading || trackerLoading) && (
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
                    value={value}
                    placeholder="0"
                    onChange={setValue}
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
                  {selectedTracker?.customAttributes && selectedTracker.customAttributes.length > 0 && (
                    <div className="space-y-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Custom Attributes</h3>
                      {selectedTracker.customAttributes.map((attr) => (
                        <div key={attr.id} className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {attr.name}
                            {attr.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {attr.type === 'text' && (
                            <input
                              type="text"
                              value={customAttributeValues[attr.id] || ''}
                              onChange={(e) => setCustomAttributeValues(prev => ({
                                ...prev,
                                [attr.id]: e.target.value
                              }))}
                              disabled={isSubmitting}
                              required={attr.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            />
                          )}
                          {attr.type === 'number' && (
                            <input
                              type="number"
                              value={customAttributeValues[attr.id] || ''}
                              onChange={(e) => setCustomAttributeValues(prev => ({
                                ...prev,
                                [attr.id]: parseFloat(e.target.value) || 0
                              }))}
                              disabled={isSubmitting}
                              required={attr.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            />
                          )}
                          {attr.type === 'date' && (
                            <input
                              type="date"
                              value={customAttributeValues[attr.id] || ''}
                              onChange={(e) => setCustomAttributeValues(prev => ({
                                ...prev,
                                [attr.id]: e.target.value
                              }))}
                              disabled={isSubmitting}
                              required={attr.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            />
                          )}
                          {attr.type === 'select' && (
                            <select
                              value={customAttributeValues[attr.id] || ''}
                              onChange={(e) => setCustomAttributeValues(prev => ({
                                ...prev,
                                [attr.id]: e.target.value
                              }))}
                              disabled={isSubmitting}
                              required={attr.required}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                            >
                              <option value="">Select an option</option>
                              {attr.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timestamp
                    </label>
                    <input
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metadata (JSON)
                    </label>
                    <textarea
                      value={metadata}
                      placeholder='{"key": "value"}'
                      onChange={(e) => setMetadata(e.target.value)}
                      disabled={isSubmitting}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional JSON metadata
                    </p>
                  </div>
                </div>

            
        </div>
      </div>
    </BaseForm>
  );
}
