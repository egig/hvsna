import { useState } from "react";
import { HvClock } from "@/modules/icons";
import { Popover, PopoverDisclosure, usePopoverStore } from "@ariakit/react";
import { TimeSelectionModal } from "@/modules/calendar/hijri-date-input/time-selection-modal";
import type { PrayerTime } from "@/domain/task";

interface TimeInputProps {
  name: string;
  label?: string;
  time: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange: (time: string | null, prayerTime?: PrayerTime) => void;
}

export default function TimeInputDesktop({
  name,
  label,
  time,
  placeholder = "",
  disabled = false,
  className = "",
  onChange,
}: TimeInputProps) {
  const popover = usePopoverStore({ placement: "bottom-start" });

  const handleTimeConfirm = (time: string) => {
    onChange(time);
    popover.hide();
  };

  const handleRemoveTime = () => {
    onChange(null, undefined);
    popover.hide();
  };

  const triggerButton = (
    <button
      type="button"
      disabled={disabled}
      className={`h-[100%] text-sm px-2 w-full text-left border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
        disabled
          ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50"
          : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <HvClock className="w-4 h-4 text-gray-400" />
        {time && (
          <span
            className={
              time
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {time}
          </span>
        )}
      </div>
    </button>
  );

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <PopoverDisclosure render={triggerButton} store={popover} />
      <Popover
        portal
        store={popover}
        gutter={8}
        hideOnInteractOutside={true}
        className="z-[10001] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto"
      >
        <TimeSelectionModal
          selectedTime={time}
          onBack={() => popover.hide()}
          onConfirm={handleTimeConfirm}
          onRemoveTime={handleRemoveTime}
        />
      </Popover>
    </div>
  );
}
