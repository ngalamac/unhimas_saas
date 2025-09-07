import React from 'react';
import { DashboardStats } from './DashboardStats';
import { Charts } from './Charts';
import { BottomCharts } from './BottomCharts';
import { Calendar } from './Calendar';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';

export const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">🏠</span>
          <h1 className="text-xl font-semibold text-gray-800">{t('dashboard.allBranchDashboard')}</h1>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{getCurrentDate()}</div>
          <div className="text-xs text-gray-500">{getCurrentTime()}</div>
        </div>
      </div>

      {/* Demo Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-red-700">
          <span className="font-medium">⚠️ Demo data reset every 30 minute. Any type of </span>
          <span className="font-medium text-red-600">image/logo</span>
          <span className="font-medium"> upload is disabled for demo version. Since many users are simultaneously testing the demo, you may find some inconsistencies, If so, you can check it again after a while.</span>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Charts Section */}
      <div className="mt-6">
        <Charts />
      </div>

      {/* Bottom Charts */}
      <div className="mt-6">
        <BottomCharts />
      </div>

      {/* Calendar Section */}
      <div className="mt-6">
        <Calendar />
      </div>
    </>
  );
};