import { Link } from "react-router";
import { type ReactNode } from "react";

type NavType = "forward" | "back" | "tab" | "modal" | "sidebar";

interface ButtonProps {
  to?: string;
  navType?: NavType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  state?: any;
}

export function Button({
  to,
  navType = "forward",
  children,
  className = "",
  onClick,
  state,
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    onClick?.();
  };

  return (
    <Link
      to={to as string}
      state={{ navType, ...state }}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
