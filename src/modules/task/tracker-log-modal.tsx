import { useState } from "react";
import { Modal } from "../navigation/modal";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { InputMode } from "../../domain/tracker/ITrackerRepository";

interface TrackerLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: { value: number; note?: string; occurredAt: number }) => void;
  taskName: string;
  inputMode: InputMode;
  unit?: string;
}

export function TrackerLogModal({
  isOpen,
  onClose,
  onSubmit,
  taskName,
  inputMode,
  unit,
}: TrackerLogModalProps) {
  const { t } = useLanguageContext();
  const [value, setValue] = useState<number>(0);
  const [valueBool, setValueBool] = useState<boolean>(true);
  const [note, setNote] = useState<string>("");

  const handleSubmit = () => {
    onSubmit({
      value: inputMode === "toggle" ? (valueBool ? 1 : 0) : value,
      note: note || undefined,
      occurredAt: Date.now(),
    });
    // Reset form
    setValue(0);
    setValueBool(true);
    setNote("");
  };

  const renderInput = () => {
    if (inputMode === "toggle") {
      return (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setValueBool(!valueBool)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              valueBool
                ? "bg-[var(--hvsna-primary-color)]"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                valueBool ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {valueBool ? t("yes") || "Yes" : t("no") || "No"}
          </span>
        </div>
      );
    }

    if (inputMode === "add") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
          />
          {unit && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </div>
      );
    }

    if (inputMode === "set") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="0"
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm"
          />
          {unit && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("log_tracker") || "Log Tracker"}
    >
      <div className="flex flex-col gap-4 p-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t("log_for") || "Log for"}:{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {taskName}
          </span>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
            {inputMode === "toggle"
              ? t("value") || "Value"
              : inputMode === "add"
              ? t("amount_to_add") || "Amount to add"
              : t("current_value") || "Current value"}
          </label>
          {renderInput()}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            {t("note_optional") || "Note (optional)"}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("add_a_note") || "Add a note..."}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] text-sm resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--hvsna-primary-color)] text-white hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] transition-colors"
          >
            {t("log") || "Log"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
