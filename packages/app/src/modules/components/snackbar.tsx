import React, { useEffect, useState } from "react";
import { HvX } from "@/modules/icons";

export interface SnackbarProps {
  isOpen: boolean;
  onClose: () => void;
  autoHideDuration?: number;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export function Snackbar({
  isOpen,
  onClose,
  autoHideDuration = 5000,
  children,
  showCloseButton = true,
  className = "",
}: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Trigger enter animation
      setTimeout(() => setIsVisible(true), 10);

      // Auto-hide after duration
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    } else {
      // Trigger exit animation
      setIsVisible(false);
      // Remove from DOM after animation completes
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen, autoHideDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`
        flex items-center justify-between
        bg-gray-900 text-white
        rounded-lg shadow-lg
        px-4 py-2
        transition-all duration-300 ease-out
        transform
        ${
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-full opacity-0 scale-95"
        }
        ${className}
      `}
      style={{
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        opacity: isVisible ? 1 : 0,
        transition:
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="flex-1 mr-3">{children}</div>

      {showCloseButton && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 text-white/70 hover:text-white transition-colors rounded"
          aria-label="Close snackbar"
        >
          <HvX size={20} />
        </button>
      )}
    </div>
  );
}
