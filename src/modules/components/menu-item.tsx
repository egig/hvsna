import { HvChevronRight, type HvIcon } from "@src/modules/icons";
import { type ReactNode } from "react";
import { Button } from "../navigation";

interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon?: HvIcon;
  onClick?: () => void;
  to?: string;
  navType?: "forward" | "back" | "tab" | "modal";
  disabled?: boolean;
  showChevron?: boolean;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function MenuItem({
  title,
  subtitle,
  icon: Icon,
  onClick,
  to,
  navType = "forward",
  disabled = false,
  showChevron = true,
  badge,
  children,
  className = "",
}: MenuItemProps) {
  // If children are provided, render them directly without Button wrapper
  if (children) {
    return (
      <div className={className}>
        <div
          className="
          relative
          w-full
          flex items-center
          px-4 py-3
          bg-white
          border-b border-gray-200
          active:bg-gray-50
          transition-colors
          duration-150
          ease-in-out
          disabled:opacity-50
          disabled:cursor-not-allowed
          /* iOS specific styling */
          [-webkit-tap-highlight-color:transparent]
          /* Android specific styling */
          [touch-action:manipulation]
        "
        >
          {/* Icon */}
          {Icon && (
            <div
              className="
              flex-shrink-0
              mr-3
              text-gray-400
              w-5 h-5
              flex items-center justify-center
            "
            >
              <Icon className="w-5 h-5" />
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0 text-left">
            {/* Title */}
            <div
              className="
              text-base
              font-medium
              text-gray-900
              truncate
            "
            >
              {title}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div
                className="
                text-sm
                text-gray-500
                mt-0.5
                truncate
              "
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Badge */}
          {badge && <div className="flex-shrink-0 mr-2">{badge}</div>}

          {/* Chevron */}
          {showChevron && (
            <div
              className="
              flex-shrink-0
              ml-2
              text-gray-400
              w-4 h-4
              flex items-center justify-center
            "
            >
              <HvChevronRight className="w-4 h-4" />
            </div>
          )}

          {/* Children */}
          <div className="absolute inset-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <Button
      to={to}
      navType={navType}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-0
        ${className}
      `}
    >
      <div
        className="
        w-full
        flex items-center
        px-4 py-3
        bg-white
        border-b border-gray-200
        active:bg-gray-50
        transition-colors
        duration-150
        ease-in-out
        disabled:opacity-50
        disabled:cursor-not-allowed
        /* iOS specific styling */
        [-webkit-tap-highlight-color:transparent]
        /* Android specific styling */
        [touch-action:manipulation]
      "
      >
        {/* Icon */}
        {Icon && (
          <div
            className="
            flex-shrink-0
            mr-3
            text-gray-400
            w-5 h-5
            flex items-center justify-center
          "
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 text-left">
          {/* Title */}
          <div
            className="
            text-base
            font-medium
            text-gray-900
            truncate
          "
          >
            {title}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              className="
              text-sm
              text-gray-500
              mt-0.5
              truncate
            "
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Badge */}
        {badge && <div className="flex-shrink-0 mr-2">{badge}</div>}

        {/* Chevron */}
        {showChevron && (
          <div
            className="
            flex-shrink-0
            ml-2
            text-gray-400
            w-4 h-4
            flex items-center justify-center
          "
          >
            <HvChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </Button>
  );
}
