import React from "react";

interface ListInputProps {
  label: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const ListInput: React.FC<ListInputProps> = ({
  label,
  rightContent,
  onClick,
  disabled = false,
  className,
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between p-2 bg-white
        hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
        touch-manipulation
        ${className}
      `}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {icon && <div className="flex-shrink-0 text-gray-400">{icon}</div>}
        <span className="text-gray-900 font-semibold text-left truncate">
          {label}
        </span>
      </div>

      {rightContent && (
        <div className="flex items-center space-x-2 flex-shrink-0">
          {rightContent}
        </div>
      )}

      {!rightContent && (
        <div className="flex-shrink-0 text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
};
