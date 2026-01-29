import { useAppNavigation } from '../hooks/useAppNavigation';
import { type ReactNode } from 'react';

type NavType = 'forward' | 'back' | 'tab' | 'modal';

interface LinkProps {
  to: string;
  navType?: NavType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({ to, navType = 'forward', children, className = '', onClick }: LinkProps) {
  const { navigate } = useAppNavigation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(to, navType);
  };

  return (
    <a 
      href={to}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
