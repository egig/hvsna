import { HvLoader2 } from "@/modules/icons";
import { type ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`
      flex
      items-center
      justify-center
      ${className}
    `}
    >
      <HvLoader2
        className={`
        ${sizeClasses[size]}
        animate-spin
        text-blue-500
      `}
      />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  text?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  text = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className="
          absolute
          inset-0
          bg-white
          bg-opacity-80
          flex
          items-center
          justify-center
          z-10
        "
        >
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}
