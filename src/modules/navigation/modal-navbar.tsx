import { HvChevronLeft, HvX, HvSearch } from "@/modules/icons";
import { useAppNavigation } from "./use-app-navigation";
import { useLocation } from "react-router";
import { useScreenSize } from "@/modules/components/screen-size-wrapper";

interface ModalNavbarProps {
  title?: string | React.ReactNode;
  customBackAction?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  onModalClose?: () => void;
}

const ROOT_PATHS = ["/"];

export function ModalNavbar({
  title,
  leftAction,
  rightAction,
  className = "",
  onModalClose,
}: ModalNavbarProps) {
  return (
    <header
      className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80  backdrop-blur-sm ${className}`}
      style={{
        position: "-webkit-sticky",
        scrollMarginTop: "64px",
      }}
    >
      {/* Left: Modal close, Back Button, or leftAction */}
      <div className="flex justify-start">
        {onModalClose ? (
          <button
            onClick={onModalClose}
            className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg transition-opacity no-select active:scale-95 transition-transform"
            aria-label="Close"
          >
            <HvX />
          </button>
        ) : (
          leftAction
        )}
      </div>

      <div className="flex-1 text-center">
        {title && (
          <h1
            className="text-lg font-semibold text-gray-900 truncate"
            data-testid="navbar-title"
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right: Action */}
      <div className="flex justify-end">{rightAction}</div>
    </header>
  );
}
