import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'offline' | 'maintenance';
  lastChecked?: string;
  details?: string;
}

interface SystemStatusCardProps {
  statuses: SystemStatus[];
  title?: string;
}

const statusConfig = {
  online: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Online'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    label: 'Warning'
  },
  offline: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    label: 'Offline'
  },
  maintenance: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Maintenance'
  }
};

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  statuses,
  title = 'System Status'
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            All Systems Operational
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {statuses.map((status) => {
          const config = statusConfig[status.status];
          const Icon = config.icon;

          return (
            <div
              key={status.id}
              className={`flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200 ${config.bg}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {status.name}
                  </p>
                  {status.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {status.details}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold ${config.color}`}>
                  {config.label}
                </span>
                {status.lastChecked && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {status.lastChecked}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
