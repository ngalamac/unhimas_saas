import React, { useState } from 'react';
import { NavigationProvider } from '../context/NavigationContext';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { PageRenderer } from '../components/dashboard/PageRenderer';
import { RoleDashboard } from '../components/dashboard/RoleDashboard';
import { QuickStatsBar } from '../components/dashboard/QuickStatsBar';
import { useNavigation } from '../context/NavigationContext';

const DashboardContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentPage, breadcrumb } = useNavigation();

  const renderMainContent = () => {
    if (currentPage === 'dashboard') {
      return <RoleDashboard />;
    }

    return (
      <PageRenderer />
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Quick Stats Bar */}
        <QuickStatsBar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
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