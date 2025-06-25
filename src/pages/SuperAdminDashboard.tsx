import React, { useState } from 'react';
import { NavigationProvider } from '../context/NavigationContext';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { Charts } from '../components/dashboard/Charts';
import { BottomCharts } from '../components/dashboard/BottomCharts';
import { Calendar } from '../components/dashboard/Calendar';
import { PageRenderer } from '../components/dashboard/PageRenderer';
import { useNavigation } from '../context/NavigationContext';
import { AlertTriangle } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentPage, breadcrumb } = useNavigation();

  const renderMainContent = () => {
    if (currentPage === 'dashboard') {
      return (
        <>
          {/* Page Title */}
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-gray-500">🏠</span>
            <h1 className="text-xl font-semibold text-gray-800">All Branch Dashboard</h1>
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
    }

    return (
      <>
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-gray-500">🏠</span>
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <span className={index === breadcrumb.length - 1 ? "text-gray-900 font-semibold" : "text-gray-600"}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Page Content */}
        <PageRenderer />
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export const SuperAdminDashboard: React.FC = () => {
  return (
    <NavigationProvider>
      <DashboardContent />
    </NavigationProvider>
  );
};