import { Link } from "react-router";
import { useAppNavigation } from "./use-app-navigation";
import { type ReactNode } from "react";

type NavType = "forward" | "back" | "tab" | "modal";

interface ButtonProps {
  to?: string;
  navType?: NavType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  to,
  navType = "forward",
  children,
  className = "",
  onClick,
  disabled = false,
}: ButtonProps) {
  const { navigate } = useAppNavigation();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;

    if (to) {
      e.preventDefault();
      navigate(to, navType);
    }

    onClick?.();
  };

  return (
    <Link
      to={to as string}
      state={{ navType }}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
