import { type ReactNode } from 'react';
import { Button } from './Button';

interface CardButtonProps {
  to?: string;
  navType?: 'forward' | 'back' | 'tab' | 'modal';
  title: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function CardButton({ 
  to, 
  navType = 'forward',
  title, 
  description, 
  icon,
  children,
  className = '',
  onClick
}: CardButtonProps) {
  return (
    <Button
      to={to}
      navType={navType}
      onClick={onClick}
      className={`w-full text-left p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 active:scale-[0.98] transition-transform ${className}`}
    >
      <div className="flex items-center">
        {icon && <span className="text-2xl mr-4">{icon}</span>}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
          {children}
        </div>
      </div>
    </Button>
  );
}
