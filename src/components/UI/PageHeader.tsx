import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  };
}

const badgeVariants = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  badge
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start space-x-4">
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            {badge && (
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeVariants[badge.variant || 'blue']}`}>
                {badge.text}
              </span>
            )}
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  );
};
