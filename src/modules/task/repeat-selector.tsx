import { useState } from "react";
import { HvRepeat } from "@/modules/icons";
import { Modal } from "src/modules/navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { TaskRepeat } from "./types";
import { RepeatSelectorModal } from "./repeat-selector-modal";

interface RepeatSelectorProps {
  value: TaskRepeat;
  interval: number;
  onChange: (value: TaskRepeat, interval: number) => void;
  disabled?: boolean;
  className?: string;
}

function formatRepeatLabel(
  repeat: TaskRepeat,
  interval: number,
  t: (key: string) => string
): string {
  if (repeat === "none") return "";

  const unitLabels: Record<string, string> = {
    daily: t("repeat_daily"),
    weekly: t("repeat_weekly"),
    monthly: t("repeat_monthly"),
    yearly: t("repeat_yearly"),
  };

  if (interval <= 1) return unitLabels[repeat] ?? repeat;
  return `${t("every") || "Every"} ${interval} ${(
    unitLabels[repeat] ?? repeat
  ).toLowerCase()}`;
}

export function RepeatSelector({
  value,
  interval,
  onChange,
  disabled = false,
  className = "",
}: RepeatSelectorProps) {
  const { t } = useLanguageContext();
  const [isOpen, setIsOpen] = useState(false);

  const label = formatRepeatLabel(value, interval, t);
  const isActive = value !== "none";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`h-full px-3 py-2 border rounded-md text-sm transition-colors flex items-center gap-2 ${
          disabled
            ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50 border-gray-300"
            : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer border-gray-300 dark:border-gray-600"
        } ${
          isActive
            ? "text-[var(--hvsna-primary-color)] border-[var(--hvsna-primary-color)]"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        <HvRepeat size={16} />
        {isActive && <span>{label}</span>}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="">
        <RepeatSelectorModal
          repeat={value}
          interval={interval}
          onBack={() => setIsOpen(false)}
          onSelectEndDate={() => {
            // Simple implementation - just show a message or handle gracefully
            alert(
              "Date selection not available in this context. Please use the full calendar modal for date selection."
            );
          }}
          onConfirm={(repeat, interval) => {
            onChange(repeat, interval);
            setIsOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
