import { useState, useEffect } from "react";
import { useTracker } from "./use-tracker";
import BaseForm from "src/components/base-form";
import Select from "src/components/form-select";
import { FormInput } from "src/components/form-input";
import { Trash2 } from "lucide-react";

interface TrackerFormProps {
  trackerId?: string | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onDelete?: (trackerId: string) => void;
}

export default function TrackerForm({
  trackerId,
  onSuccess,
  onError,
  onCancel,
  onDelete,
}: TrackerFormProps) {
  const { loading, error, createTracker, updateTracker, getTracker, tracker } =
    useTracker(trackerId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<any>();

  useEffect(() => {
    if (tracker) {
      setSelectedType(tracker.type);
    }
  }, [tracker]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async (form: FormData) => {
    try {
      setIsSubmitting(true);

      const name = form.get("name") as string;
      const type = form.get("type") as any;
      const unit = form.get("unit") as string;
      const baseline = form.get("baseline") as string;
      const negative = form.get("negative") as string;
      const format = form.get("format") as string;

      if (!name || !type) {
        if (onError) onError("Name and type fields are required");
        return;
      }

      if (trackerId && tracker) {
        await updateTracker(tracker.id, {
          name,
          unit,
          type,
          negative: Boolean(negative),
          baseline: parseFloat(baseline) || 0,
          format: (format as "plain" | "idr") || "plain",
        });
      } else {
        await createTracker({
          name,
          type,
          unit,
          negative: Boolean(negative),
          baseline: parseFloat(baseline) || 0,
          format: (format as "plain" | "idr") || "plain",
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

  const handleDelete = () => {
    if (trackerId && onDelete && tracker) {
      if (
        confirm(
          `Are you sure you want to delete "${tracker.name}"? This action cannot be undone.`,
        )
      ) {
        onDelete(trackerId);
      }
    }
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

            <Select
              name="type"
              label="Type"
              key={Math.random()}
              value={selectedType}
              required
              onChange={(e) => {
                setSelectedType(e.target.value);
              }}
              options={[
                {
                  value: "counter",
                  label: "Counter",
                },
                {
                  value: "amount",
                  label: "Amount",
                },
              ]}
            />

            <div className="mb-4">
              <label>
                <input
                  key={Math.random()}
                  defaultChecked={tracker?.negative}
                  name="negative"
                  type="checkbox"
                />{" "}
                Negative
              </label>
            </div>

            {selectedType === "amount" && (
              <FormInput
                name="unit"
                label="Unit"
                value={tracker?.unit || ""}
                placeholder="e.g., kg, hours, IDR, count"
                disabled={isSubmitting}
                className="text-base"
              />
            )}

            {selectedType === "amount" && (
              <FormInput
                name="baseline"
                label="Baseline"
                value={tracker?.baseline?.toString() || ""}
                placeholder="e.g., 0, 100, 1000"
                type="number"
                disabled={isSubmitting}
                className="text-base"
              />
            )}

            {selectedType === "amount" && (
              <Select
                name="format"
                label="Format"
                key={Math.random()}
                value={tracker?.format || "plain"}
                disabled={isSubmitting}
                options={[
                  {
                    value: "plain",
                    label: "Plain Number",
                  },
                  {
                    value: "idr",
                    label: "Indonesian Rupiah",
                  },
                ]}
              />
            )}
          </div>

          {/* Delete Button - Only show for existing trackers */}
          {trackerId && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full px-4 py-3 hover:text-red-600 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Tracker
              </button>
            </div>
          )}
        </div>
      </div>
    </BaseForm>
  );
}
