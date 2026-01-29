import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div className={`
      bg-white
      rounded-lg
      ${paddingClasses[padding]}
      ${shadowClasses[shadow]}
      ${border ? 'border border-gray-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`
      mb-4
      pb-4
      border-b
      border-gray-200
      ${className}
    `}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CardTitle({
  children,
  className = '',
  size = 'md',
}: CardTitleProps) {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
  };

  return (
    <h3 className={`
      text-gray-900
      ${sizeClasses[size]}
      ${className}
    `}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className = '',
}: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
