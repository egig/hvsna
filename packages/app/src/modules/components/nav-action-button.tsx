import type { ButtonHTMLAttributes } from "react";

interface NavActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "neutral";
}

export function NavActionButton({
  variant = "neutral",
  className = "",
  children,
  ...props
}: NavActionButtonProps) {
  const base =
    "rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50";
  const variants = {
    primary:
      "text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)]",
    neutral:
      "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg text-gray-700 dark:text-gray-300",
  };

  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
