import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan';
  badge?: string;
}

interface QuickActionCardProps {
  actions: QuickAction[];
  title?: string;
}

const gradientClasses = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-emerald-500 to-teal-500',
  purple: 'from-purple-500 to-pink-500',
  orange: 'from-orange-500 to-red-500',
  cyan: 'from-cyan-500 to-blue-500'
};

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  actions,
  title = 'Quick Actions'
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const gradient = action.gradient || 'blue';

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:from-white hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] text-left"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradientClasses[gradient]} shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  {action.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
