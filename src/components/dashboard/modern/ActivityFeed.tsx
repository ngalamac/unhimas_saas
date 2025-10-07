import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  type: 'success' | 'info' | 'warning' | 'error';
  user?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
}

const typeStyles = {
  success: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  info: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  warning: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800'
  },
  error: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = 'Recent Activity',
  maxItems = 5
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>

      <div className="space-y-3">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          displayActivities.map((activity) => {
            const styles = typeStyles[activity.type];
            const Icon = activity.icon;

            return (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${styles.bg} ${styles.border}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${styles.dot} animate-pulse`}></div>
                {Icon && (
                  <div className={`p-2 rounded-lg ${styles.bg}`}>
                    <Icon className={`w-4 h-4 ${styles.text}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {activity.timestamp}
                    </span>
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.user}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
