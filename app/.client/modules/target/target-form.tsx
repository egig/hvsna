import { useState, useEffect } from "react";
import type {
  Tracker,
  Target as TargetType,
  TargetType as TargetTypeEnum,
  TargetPeriod,
} from "~/lib/tracker/types";
import {
  useTarget,
  type TargetDirection,
  type TargetCalculation,
} from "../target/use-target";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";
import { useTrackers } from "../tracker/use-trackers";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";

interface TargetFormProps {
  targetId?: string | null;
  onSuccess?: (target: TargetType) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TargetForm({
  targetId,
  onSuccess,
  onError,
  onCancel,
}: TargetFormProps) {
  const { loading: trackerLoading, getTrackers } = useTrackers();
  const { loading, error, createTarget, updateTarget, getTarget, target } =
    useTarget(targetId as string);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(target?.trackerId || "");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(target?.scope || []);
  const { trackerAttributes, loading: attributesLoading } = useTrackerAttributes(
    selectedTrackerId
  );

  useEffect(() => {
    // Load available trackers
    getTrackers()
      .then((trackerData) => {
        setTrackers(trackerData);
      })
      .catch(() => {
        // Handle error silently
      });
  }, [getTrackers]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    // Update form state when target changes
    if (target) {
      setSelectedTrackerId(target.trackerId);
      setSelectedAttributes(target.scope || []);
    }
  }, [target]);

  const handleSubmit = async (formData: FormData) => {
    const trackerId = formData.get("trackerId") as string;
    const type = formData.get("type") as TargetTypeEnum;
    const calculation = formData.get("calculation") as TargetCalculation;
    const direction = formData.get("direction") as TargetDirection;
    const value = formData.get("value") as string;
    const valueMax = formData.get("valueMax") as string;
    const period = formData.get("period") as TargetPeriod;
    const name = formData.get("name") as string;

    try {
      setIsSubmitting(true);

      let result: TargetType;
      const targetData = {
        name,
        trackerId,
        type,
        calculation,
        direction,
        value: parseFloat(value) || 0,
        valueMax:
          type === "range" ? parseFloat(valueMax) || undefined : undefined,
        period,
        scope: selectedAttributes,
      };

      if (targetId) {
        result = await updateTarget(targetId, targetData);
      } else {
        result = await createTarget(targetData);
      }

      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      throw err; // Re-throw to let BaseForm handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleTrackerChange = (trackerId: string) => {
    setSelectedTrackerId(trackerId);
    // Reset selected attributes when tracker changes
    setSelectedAttributes([]);
  };

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributes(prev => 
      prev.includes(attributeId) 
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    );
  };

  const selectedTracker = trackers.find((t) => t.id === selectedTrackerId);

  // Helper function to add sample custom attributes for testing
  return (
    <BaseForm
      title={targetId ? "Edit Target" : "New Target"}
      onSuccess={onSuccess}
      onError={onError}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
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
          <div className="space-y-5">
            <FormInput
              name="name"
              label="Name"
              type="text"
              value={target?.name || ""}
              placeholder="Target name"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracker
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="trackerId"
                value={selectedTrackerId}
                onChange={(e) => handleTrackerChange(e.target.value)}
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

            {/* Attributes Multi-Select */}
            {selectedTracker && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attributes
                  <span className="text-gray-400 ml-1">(optional)</span>
                </label>
                {attributesLoading ? (
                  <div className="text-sm text-gray-500 italic border border-gray-200 rounded-lg p-3 bg-gray-50">
                    Loading attributes...
                  </div>
                ) : trackerAttributes && trackerAttributes.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {trackerAttributes.map((attribute) => (
                      <label
                        key={attribute.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAttributes.includes(attribute.id)}
                          onChange={() => handleAttributeToggle(attribute.id)}
                          disabled={isSubmitting}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {attribute.name}
                          {attribute.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          <span className="text-gray-400 ml-1">({attribute.type})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic border border-gray-200 rounded-lg p-3 bg-gray-50">
                    No custom attributes defined for this tracker. 
                    <span className="block text-xs mt-1">
                      Custom attributes can be added to trackers to enable more detailed tracking.
                    </span>
                  </div>
                )}
                {selectedAttributes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedAttributes.length} attribute{selectedAttributes.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                name="type"
                defaultValue={target?.type || "static"}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="static">Static</option>
                <option value="range">Range</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculation
              </label>
              <select
                name="calculation"
                defaultValue={target?.calculation || "sum"}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="sum">Sum</option>
                <option value="count">Count</option>
                <option value="last">Last</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direction
              </label>
              <select
                name="direction"
                defaultValue={target?.direction || "increase"}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="increase">Increase (good when up)</option>
                <option value="decrease">Decrease (good when down)</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <FormInput
              name="value"
              label={target?.type === "range" ? "Target" : "Value"}
              type="number"
              value={target?.value?.toString() || ""}
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

            {target?.type === "range" && (
              <>
                <FormInput
                  name="valueMax"
                  label="Maximum"
                  type="number"
                  value={target?.valueMax?.toString() || ""}
                  placeholder="Maximum value"
                  disabled={isSubmitting}
                  className="text-base"
                />
                {selectedTracker && (
                  <p className="text-sm text-gray-500 -mt-2 mb-4">
                    Maximum in {selectedTracker.unit}
                  </p>
                )}
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                name="period"
                defaultValue={target?.period || "monthly"}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="total">Total</option>
              </select>
            </div>
            
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
