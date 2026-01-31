import { useState, useEffect } from "react";
import type { Tracker } from "~/lib/tracker/types";
import { FormInput } from "~/.client/components/form-input";
import BaseForm from "~/.client/components/base-form";
import { useTracker } from "./use-tracker";

interface TrackerFormProps {
  trackerId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TrackerForm({
  trackerId,
  onSuccess,
  onError,
  onCancel,
}: TrackerFormProps) {
  const { loading, error, createTracker, updateTracker, getTracker, tracker } =
    useTracker(trackerId || undefined);
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
      const unit = form.get("unit") as string;
      const baseline = form.get("baseline") as string;

      if (!name || !unit || !baseline) {
        if (onError) onError("All fields are required");
        return;
      }


      if (trackerId && tracker) {
        await updateTracker(tracker.id, {
          name,
          unit,
          baseline: parseFloat(baseline) || 0,
        });
      } else {
        await createTracker({
          name,
          unit,
          baseline: parseFloat(baseline) || 0,
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
      title={trackerId ? "Edit Tracker" : "New Tracker"}
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
              value={tracker?.name || ""}
              placeholder="Enter tracker name"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />

            <FormInput
              name="unit"
              label="Unit"
              value={tracker?.unit || ""}
              placeholder="e.g., kg, hours, IDR, count"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />

            <FormInput
              name="baseline"
              label="Baseline"
              value={tracker?.baseline?.toString() || ""}
              placeholder="e.g., 0, 100, 1000"
              type="number"
              disabled={isSubmitting}
              required={true}
              className="text-base"
            />
          </div>
        </div>
      </div>
    </BaseForm>
  );
}
