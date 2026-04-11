import { useState } from "react";
import { HvClock } from "@/modules/icons";
import { Modal } from "src/modules/navigation";
import { TimeSelectionModal } from "./hijri-date-input/time-selection-modal";
import type { PrayerTime } from "src/modules/task/types";

interface TimeInputProps {
  name: string;
  label?: string;
  customTime: string;
  prayerTime: PrayerTime;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange: (time: string | null, prayerTime?: PrayerTime) => void;
}

export function TimeInput({
  name,
  label,
  customTime,
  prayerTime,
  placeholder = "",
  disabled = false,
  required = false,
  className = "",
  onChange,
}: TimeInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTimeConfirm = (
    time: string,
    selectedPrayerTime?: PrayerTime | string,
  ) => {
    onChange(time, selectedPrayerTime as PrayerTime);
    setIsModalOpen(false);
  };

  const handleRemoveTime = () => {
    onChange(null, undefined);
    setIsModalOpen(false);
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const formatTimeDisplay = (time: string | null, prayer?: PrayerTime) => {
    if (prayer) {
      return `${prayer}`;
    }
    if (!time) return placeholder;
    return time;
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`h-[100%] px-2 w-full text-left border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={
              customTime || prayerTime
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {formatTimeDisplay(customTime, prayerTime)}
          </span>
          <HvClock className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <TimeSelectionModal
          selectedTime={customTime}
          selectedPrayerTime={prayerTime}
          onBack={() => setIsModalOpen(false)}
          onConfirm={handleTimeConfirm}
          onRemoveTime={handleRemoveTime}
        />
      </Modal>
    </div>
  );
}
