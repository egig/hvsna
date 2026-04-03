import React from "react";

interface ListInputSelectOption {
  value: string;
  label: string;
}

interface ListInputSelectProps {
  label: string;
  options: ListInputSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  helpText?: React.ReactNode;
}

export const ListInputSelect: React.FC<ListInputSelectProps> = ({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  icon,
  helpText,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value);
  };

  return (
    <div className={`p-2 border-b border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {icon && <div className="flex-shrink-0 text-gray-400">{icon}</div>}
          <span className="text-gray-900 font-semibold text-left truncate">
            {label}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 min-w-0 max-w-[50%]">
          <select
            value={value || ""}
            onChange={handleChange}
            disabled={disabled}
            className="
              px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm
              hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
              touch-manipulation min-w-0 truncate
            "
          >
            {!value && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {helpText && (
        <div className="mt-2 text-sm text-gray-500 pl-0">{helpText}</div>
      )}
    </div>
  );
};
