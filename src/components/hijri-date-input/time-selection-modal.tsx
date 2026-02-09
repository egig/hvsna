import { Check } from "lucide-react";
import { Navbar } from "src/modules/navigation";

interface TimeSelectionModalProps {
  selectedHour: number;
  selectedMinute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  onRemoveTime: () => void;
}

export function TimeSelectionModal({
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
  onBack,
  onConfirm,
  onRemoveTime,
}: TimeSelectionModalProps) {
  return (
    <div className="h-[50vh]">
      <Navbar
        title="Select Time"
        showBackButton={true}
        customBackAction={onBack}
        rightAction={
          <button
            onClick={onConfirm}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            <Check />
          </button>
        }
      />
      <div className="flex gap-2">
        <select
          value={selectedHour}
          onChange={(e) => onHourChange(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="flex items-center text-gray-500 dark:text-gray-400">
          :
        </span>
        <select
          value={selectedMinute}
          onChange={(e) => onMinuteChange(parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button onClick={onRemoveTime}>Remove time</button>
      </div>
    </div>
  );
}
