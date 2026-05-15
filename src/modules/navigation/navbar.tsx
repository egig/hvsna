import { HvChevronLeft, HvX, HvSearch } from "@/modules/icons";
import { useAppNavigation } from "./use-app-navigation";
import { useLocation } from "react-router";
import { useState, useEffect } from "react";
import { useScreenSize } from "@/modules/components/screen-size-wrapper";

interface NavbarProps {
  title?: string | React.ReactNode;
  showBackButton?: boolean;
  customBackAction?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  modal?: boolean;
  onModalClose?: () => void;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

const ROOT_PATHS = ["/"];

export function Navbar({
  title,
  showBackButton: propShowBackButton,
  customBackAction,
  leftAction,
  rightAction,
  className = "",
  modal,
  onModalClose,
  subtitle,
  showSearch,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}: NavbarProps) {
  const { goBack } = useAppNavigation();
  const location = useLocation();
  const { isDesktop } = useScreenSize();

  // Auto-determine if back button should be shown
  const shouldShowBackButton =
    (propShowBackButton ?? !ROOT_PATHS.includes(location.pathname)) &&
    !isDesktop;

  const handleBack = () => {
    if (customBackAction) {
      customBackAction();
    } else {
      goBack();
    }
  };

  return (
    <header
      className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80  backdrop-blur-sm ${
        !modal ? "safe-top" : ""
      } ${className}`}
      style={{
        position: "-webkit-sticky",
        scrollMarginTop: "64px",
      }}
    >
      {/* Left: Modal close, Back Button, or leftAction */}
      <div className="flex justify-start">
        {modal && onModalClose ? (
          <button
            onClick={onModalClose}
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
            aria-label="Close"
          >
            <HvX />
          </button>
        ) : shouldShowBackButton ? (
          <button
            onClick={handleBack}
            data-testid="navbar-back-button"
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
            aria-label="Go back"
          >
            {modal ? <HvX /> : <HvChevronLeft />}
          </button>
        ) : (
          leftAction
        )}
      </div>

      {/* Center: Title or Search */}
      <div className="flex-1 text-center">
        {showSearch ? (
          <div className="relative max-w-md mx-auto">
            <HvSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit?.(searchValue);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <HvX className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {title && (
              <h1
                className="text-lg font-semibold text-gray-900 truncate"
                data-testid="navbar-title"
              >
                {title}
              </h1>
            )}
            {/* Subtitle */}
            {subtitle && (
              <div className="text-xs text-gray-500">{subtitle}</div>
            )}
          </>
        )}
      </div>

      {/* Right: Action */}
      <div className="flex justify-end">{rightAction}</div>
    </header>
  );
}

export function LargeNavbar({
  title,
  showBackButton: propShowBackButton,
  customBackAction,
  leftAction,
  rightAction,
  className = "",
  modal,
  onModalClose,
  subtitle,
  showSearch,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
}: NavbarProps) {
  const { goBack } = useAppNavigation();
  const location = useLocation();
  const { isDesktop } = useScreenSize();
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-determine if back button should be shown
  const shouldShowBackButton =
    (propShowBackButton ?? !ROOT_PATHS.includes(location.pathname)) &&
    !isDesktop;

  const handleBack = () => {
    if (customBackAction) {
      customBackAction();
    } else {
      goBack();
    }
  };

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 20);
    };

    // Find the scrollable parent container
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }

    // Fallback to window scroll if no container found
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-100 px-2 py-2 bg-white/80 backdrop-blur-sm ${
          !modal ? "safe-top" : ""
        } ${className}`}
        style={{
          position: "-webkit-sticky",
          scrollMarginTop: "62px",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Modal close, Back Button, or leftAction */}
          <div className="flex justify-start">
            {modal && onModalClose ? (
              <button
                onClick={onModalClose}
                className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
                aria-label="Close"
              >
                <HvX />
              </button>
            ) : shouldShowBackButton ? (
              <button
                onClick={handleBack}
                className={`flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-all no-select active:scale-95 transition-transform ${
                  isScrolled ? "w-10 h-10" : "w-12 h-12"
                }`}
                aria-label="Go back"
              >
                {modal ? <HvX /> : <HvChevronLeft />}
              </button>
            ) : (
              !isScrolled && leftAction
            )}
          </div>

          {/* Center: Title or Search */}
          <div
            className={`flex-1 text-center transition-opacity duration-800 ${
              isScrolled ? "opacity-100" : "opacity-0"
            }`}
          >
            {showSearch ? (
              <div className="relative max-w-md mx-auto">
                <HvSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSearchSubmit?.(searchValue);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <HvX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                {title && (
                  <h1
                    className={`text-lg font-semibold text-gray-900 truncate`}
                  >
                    {title}
                  </h1>
                )}
                {/* Subtitle */}
                {subtitle && (
                  <div className={`text-xs text-gray-500`}>{subtitle}</div>
                )}
              </>
            )}
          </div>

          {/* Right: Action */}
          <div className="flex justify-end">{rightAction}</div>
        </div>
      </header>

      <div className={`bg-white/80 backdrop-blur-sm px-4 h-20`}>
        <div
          className={`h-full flex flex-col justify-end pb-4 transition-all duration-1000 ${
            isScrolled ? "opacity-0" : "opacity-100"
          }`}
        >
          {showSearch ? (
            <div className="relative max-w-lg mx-auto">
              <HvSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearchSubmit?.(searchValue);
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-12 pr-12 py-3 bg-gray-100 border border-gray-200 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <HvX className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <>
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900 truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <div className="text-sm text-gray-500 truncate">{subtitle}</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
