import React from 'react';
import { DashboardStats } from './DashboardStats';
import { Charts } from './Charts';
import { BottomCharts } from './BottomCharts';
import { Calendar } from './Calendar';
import { AlertTriangle, Database, Shield, RefreshCw } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const SuperAdminDashboard: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();

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
          <h1 className="text-xl font-semibold text-gray-800">All Branch Dashboard</h1>
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
          <span className="font-medium">⚠️ Please make sure you restrict this dashboard only for confidential users. </span>
          <span className="font-medium text-red-600">Do not share your credentials with anybody.</span>
          <span className="font-medium"> <br />Click Here to contact <a href="mailto:macngala4@gmail.com"><b className='bold text-blue-700'>Codegisoft</b></a> in case of any challenge  </span>
        </div>
      </div>

      {/* Quick Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => {
            setCurrentPage('backup-management');
            setBreadcrumb(['Administration', 'Backup & Restore']);
          }}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">System Backup</h4>
              <p className="text-sm text-gray-600">Backup & restore system data</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setCurrentPage('enhanced-roles');
            setBreadcrumb(['Administration', 'Roles & Access']);
          }}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Security Management</h4>
              <p className="text-sm text-gray-600">Manage roles & permissions</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setCurrentPage('view-branches');
            setBreadcrumb(['Administration', 'Branches']);
          }}
          className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">System Monitoring</h4>
              <p className="text-sm text-gray-600">Monitor system health</p>
            </div>
          </div>
        </button>
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