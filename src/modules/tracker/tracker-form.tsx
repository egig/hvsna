import { useState, useEffect } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTrackers } from "./use-trackers";
import type { InputMode, Tracker } from "../../domain/tracker/ITrackerRepository";
import { HvX } from "../icons";

interface TrackerFormProps {
  editingId?: string | null;
  onClose: () => void;
}

function TextInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
    />
  );
}

export function TrackerForm({ editingId, onClose }: TrackerFormProps) {
  const { t } = useLanguageContext();
  const { data: trackers, createTracker, updateTracker } = useTrackers();

  const existing = editingId
    ? trackers?.find((tr: Tracker) => tr.id === editingId)
    : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [inputMode, setInputMode] = useState<InputMode>(
    existing?.inputMode ?? "toggle"
  );
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setInputMode(existing.inputMode ?? "toggle");
      setUnit(existing.unit ?? "");
    }
  }, [editingId]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("tracker_name_required") || "Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        inputMode,
        unit: unit.trim() || undefined,
      };
      if (editingId) {
        await updateTracker(editingId, payload);
      } else {
        await createTracker(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions: { value: InputMode; label: string }[] = [
    { value: "toggle", label: t("tracker_type_toggle") || "Yes / No" },
    { value: "add", label: t("tracker_type_add") || "Add amount" },
    { value: "set", label: t("tracker_type_set") || "Record current" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {editingId
            ? t("edit_tracker") || "Edit Tracker"
            : t("new_tracker") || "New Tracker"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <HvX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("tracker_name") || "Name"}
          </label>
          <TextInput
            value={name}
            onChange={(v) => {
              setName(v);
              setNameError(null);
            }}
            placeholder={
              t("tracker_name_placeholder") || "e.g. Water intake, Exercise..."
            }
            autoFocus={!editingId}
          />
          {nameError && (
            <p className="mt-1.5 text-xs text-[var(--hvsna-danger-color)]">
              {nameError}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("tracker_unit") || "Unit (optional)"}
          </label>
          <TextInput
            value={unit}
            onChange={setUnit}
            placeholder={
              t("tracker_unit_placeholder") || "e.g. cups, km, minutes..."
            }
          />
        </div>

        {/* Type */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t("tracker_type") || "Type"}
          </p>
          <div className="flex gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInputMode(opt.value)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  inputMode === opt.value
                    ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/10 text-[var(--hvsna-primary-color)]"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-[var(--hvsna-primary-color)] text-white text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? "..." : t("save") || "Save"}
        </button>
      </div>
    </div>
  );
}
