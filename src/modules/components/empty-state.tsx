import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 text-gray-300 mb-4">{icon}</div>
      <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}
