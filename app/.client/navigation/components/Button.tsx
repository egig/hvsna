import { useAppNavigation } from '../hooks/useAppNavigation';
import { type ReactNode } from 'react';

type NavType = 'forward' | 'back' | 'tab' | 'modal';

interface ButtonProps {
  to?: string;
  navType?: NavType;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  to, 
  navType = 'forward', 
  children, 
  className = '', 
  onClick,
  disabled = false,
  type = 'button'
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
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}
