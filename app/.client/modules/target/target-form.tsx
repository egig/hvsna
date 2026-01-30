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
  type TargetReducer,
} from "../target/use-target";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";
import { useTrackers } from "../tracker/use-trackers";

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

  useEffect(() => {
    // Load available trackers
    getTrackers()
      .then(setTrackers)
      .catch(() => {
        // Handle error silently
      });
  }, [getTrackers]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (formData: FormData) => {
    const trackerId = formData.get("trackerId") as string;
    const type = formData.get("type") as TargetTypeEnum;
    const reducer = formData.get("reducer") as TargetReducer;
    const direction = formData.get("direction") as TargetDirection;
    const value = formData.get("value") as string;
    const valueMax = formData.get("valueMax") as string;
    const period = formData.get("period") as TargetPeriod;
    const soft = formData.get("soft") as string; // formData.get returns string

    try {
      setIsSubmitting(true);

      let result: TargetType;
      const targetData = {
        trackerId,
        type,
        reducer,
        direction,
        value: parseFloat(value) || 0,
        valueMax:
          type === "range" ? parseFloat(valueMax) || undefined : undefined,
        period,
        soft: soft === "true",
      };

      if (targetId) {
        result = await updateTarget(targetId, targetData);
      } else {
        result = await createTarget(targetData);
      }

      if (onSuccess) {
        onSuccess(result);
      }
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

  const selectedTracker = trackers.find((t) => t.id === target?.trackerId);

  return (
    <BaseForm
      title={targetId ? "Edit Target" : "New Target"}
      onSuccess={() => {}}
      onError={onError}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
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
                defaultValue={target?.trackerId || ""}
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
                Reducer
              </label>
              <select
                name="reducer"
                defaultValue={target?.reducer || "sum"}
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="soft"
                id="soft"
                defaultChecked={target?.soft || false}
                disabled={isSubmitting}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="soft"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Soft limit
              </label>
            </div>
            {target?.soft && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow going over/under without strict enforcement
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
