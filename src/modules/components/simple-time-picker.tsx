import { useState } from "react";
import { HvClock, HvChevronDown } from "@/modules/icons";
import { Modal } from "../navigation";

interface SimpleTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className = "",
}: SimpleTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  // Parse current value when opening modal
  const openModal = () => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(parseInt(h) || 0);
      setMinute(parseInt(m) || 0);
    }
    setIsOpen(true);
  };

  const handleConfirm = () => {
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return placeholder;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const minute = parseInt(m);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-lg
          hover:border-[var(--hvsna-primary-color)] transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed text-left
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <HvClock className="w-4 h-4 text-gray-400" />
          <span
            className={
              value ? "font-medium" : "text-gray-500 dark:text-gray-400"
            }
          >
            {formatDisplayTime(value)}
          </span>
        </div>
        <HvChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      <Modal isOpen={isOpen} onClose={handleCancel} title="Select Time">
        <div className="flex flex-col">
          {/* Current Time Display */}
          <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {hour.toString().padStart(2, "0")}:
              {minute.toString().padStart(2, "0")}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {hour >= 12 ? "PM" : "AM"} •{" "}
              {hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:
              {minute.toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hour
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")} ({i >= 12 ? "PM" : "AM"}{" "}
                      {i > 12 ? i - 12 : i === 0 ? 12 : i})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minute
                </label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-[var(--hvsna-primary-color)] text-white rounded-lg hover:bg-[var(--hvsna-primary-color-hover)] transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
