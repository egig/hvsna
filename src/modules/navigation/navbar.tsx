import { ChevronLeft, X } from "lucide-react";
import { useAppNavigation } from "./use-app-navigation";
import { useLocation } from "react-router";
import { useState, useEffect } from "react";

interface NavbarProps {
  title?: string | React.ReactNode;
  showBackButton?: boolean;
  customBackAction?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  modal?: boolean;
  subtitle?: string;
}

const ROOT_PATHS = ["/"];

export function Navbar({
  title,
  showBackButton: propShowBackButton,
  customBackAction,
  rightAction,
  className = "",
  modal,
  subtitle,
}: NavbarProps) {
  const { goBack } = useAppNavigation();
  const location = useLocation();

  // Auto-determine if back button should be shown
  const shouldShowBackButton =
    propShowBackButton ?? !ROOT_PATHS.includes(location.pathname);

  const handleBack = () => {
    if (customBackAction) {
      customBackAction();
    } else {
      goBack();
    }
  };

  return (
    <header
      className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80  backdrop-blur-sm safe-top ${className}`}
      style={{
        position: "-webkit-sticky",
        scrollMarginTop: "64px",
      }}
    >
      {/* Left: Back Button */}
      <div className="w-16 flex justify-start">
        {shouldShowBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
            aria-label="Go back"
          >
            {modal && <X />}
            {modal || <ChevronLeft />}
          </button>
        )}
      </div>

      {/* Center: Title */}
      <div className="flex-1 text-center">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}
        {/* Subtitle */}
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>

      {/* Right: Action */}
      <div className="w-16 flex justify-end">{rightAction}</div>
    </header>
  );
}

export function LargeNavbar({
  title,
  showBackButton: propShowBackButton,
  customBackAction,
  rightAction,
  className = "",
  modal,
  subtitle,
}: NavbarProps) {
  const { goBack } = useAppNavigation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Auto-determine if back button should be shown
  const shouldShowBackButton =
    propShowBackButton ?? !ROOT_PATHS.includes(location.pathname);

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
        className={`sticky top-0 z-10 px-2 py-2 bg-white/80 backdrop-blur-sm safe-top ${className}`}
        style={{
          position: "-webkit-sticky",
          scrollMarginTop: "62px",
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <div className="w-16 flex justify-start">
            {shouldShowBackButton && (
              <button
                onClick={handleBack}
                className={`flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-all no-select active:scale-95 transition-transform ${
                  isScrolled ? "w-10 h-10" : "w-12 h-20"
                }`}
                aria-label="Go back"
              >
                {modal && <X />}
                {modal || <ChevronLeft />}
              </button>
            )}
          </div>

          {/* Center: Title */}
          <div
            className={`flex-1 text-center transition-opacity duration-800 ${isScrolled ? "opacity-100" : "opacity-0"}`}
          >
            {title && (
              <h1 className={`text-lg font-semibold text-gray-900 truncate`}>
                {title}
              </h1>
            )}
            {/* Subtitle */}
            {subtitle && (
              <div className={`text-xs text-gray-500`}>{subtitle}</div>
            )}
          </div>

          {/* Right: Action */}
          <div className="w-16 flex justify-end">{rightAction}</div>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-sm px-4 h-20">
        <div
          className={`h-full flex flex-col justify-end pb-4 transition-opacity duration-500 ${isScrolled ? "opacity-0" : "opacity-100"}`}
        >
          {title && (
            <h1 className="text-2xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <div className="text-sm text-gray-500 truncate">{subtitle}</div>
          )}
        </div>
      </div>
    </>
  );
}
