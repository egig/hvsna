import { type ReactNode } from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const variantStyles = {
  blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
  purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
  green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
  orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800',
  pink: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800',
  gray: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-800'
};

const sizeStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

const iconSizes = {
  sm: 'text-lg mb-1',
  md: 'text-2xl mb-2',
  lg: 'text-3xl mb-3'
};

const titleSizes = {
  sm: 'text-sm font-medium',
  md: 'font-semibold text-gray-900 dark:text-white mb-1',
  lg: 'text-lg font-semibold text-gray-900 dark:text-white mb-2'
};

const descriptionSizes = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm'
};

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  variant = 'blue',
  size = 'md',
  className = '',
  children,
  onClick
}: FeatureCardProps) {
  const baseClasses = `bg-gradient-to-br rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]}`;
  const clickableClasses = onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '';
  
  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      <span className={`${iconSizes[size]} block`}>{icon}</span>
      <h3 className={`${titleSizes[size]}`}>{title}</h3>
      <p className={`${descriptionSizes[size]} text-gray-600 dark:text-gray-400`}>
        {description}
      </p>
      {children}
    </div>
  );
}
