import { HvX, HvSearch } from "@/modules/icons";
import type { ReactNode } from "react";
import { SidebarToggleButton } from "./sidebar-context";
import { DESKTOP_INSET } from "./page";

export interface NavbarDesktopProps {
  title?: ReactNode;
  /** Small kicker line rendered above the title (e.g. the Hijri date). */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  /** Match a `fluid` PageDesktop — drop the centered inset and span full width. */
  fluid?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

/**
 * Desktop page header. A single sticky bar — there is no "large" variant.
 * Navigation happens through the sidebar, so it never renders a back button.
 */
export function NavbarDesktop({
  title,
  eyebrow,
  subtitle,
  leftAction,
  rightAction,
  className = "",
  fluid = false,
  showSearch,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}: NavbarDesktopProps) {
  return (
    <header
      className={`sticky top-0 z-10 bg-white/80 backdrop-blur-sm ${className}`}
    >
      {/* Items align to the top, not centered — a taller navbar (eyebrow +
          subtitle) keeps the toggle and edge actions pinned where the
          sidebar's own toggle sits rather than drifting down. */}
      <div className="flex items-start gap-3 px-4 py-3">
        <SidebarToggleButton className="flex-shrink-0 -ml-1" />

        {leftAction && <div className="flex-shrink-0">{leftAction}</div>}

        {/* Only the title/search block honours the inset — edge actions stay put. */}
        <div className={`flex-1 min-w-0 ${fluid ? "" : DESKTOP_INSET}`}>
          {showSearch ? (
            <SearchInput
              value={searchValue}
              placeholder={searchPlaceholder}
              onChange={onSearchChange}
              onSubmit={onSearchSubmit}
            />
          ) : (
            <>
              {eyebrow && (
                <div className="text-[10px] font-extrabold tracking-wide uppercase text-primary-500 dark:text-primary-300 truncate">
                  {eyebrow}
                </div>
              )}
              {title && (
                <h1
                  className="text-lg font-semibold text-gray-900 truncate"
                  data-testid="navbar-title"
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <div className="text-xs text-gray-500 truncate">{subtitle}</div>
              )}
            </>
          )}
        </div>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}

function SearchInput({
  value,
  placeholder,
  onChange,
  onSubmit,
}: {
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}) {
  return (
    <div className="relative max-w-md">
      <HvSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.(value);
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={() => onChange?.("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <HvX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
