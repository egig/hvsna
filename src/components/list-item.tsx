import React from "react";

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  compact?: boolean;
  hoverable?: boolean;
}

export function ListItem({
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  onClick,
  className = "",
  children,
  compact = false,
  hoverable = true,
}: ListItemProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 p-4 transition-${
        hoverable && onClick ? "cursor-pointer hover:shadow-sm" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Left Icon */}
        {leftIcon && <div className="flex-shrink-0 mt-1">{leftIcon}</div>}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-gray-900 dark:text-white truncate ${
              hoverable && onClick
                ? "hover:text-blue-600 dark:hover:text-blue-400"
                : ""
            }`}
          >
            {title}
          </h3>

          {subtitle && (
            <p
              className={`text-gray-500 dark:text-gray-400 mt-1 ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {subtitle}
            </p>
          )}

          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {description}
            </p>
          )}

          {/* Additional Content */}
          {children}
        </div>

        {/* Right Icon */}
        {rightIcon && <div className="flex-shrink-0">{rightIcon}</div>}
      </div>
    </div>
  );
}
