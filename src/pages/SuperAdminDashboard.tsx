import React, { useState } from 'react';
import { NavigationProvider } from '../context/NavigationContext';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { PageRenderer } from '../components/dashboard/PageRenderer';
import { RoleDashboard } from '../components/dashboard/RoleDashboard';
import { useNavigation } from '../context/NavigationContext';

const DashboardContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentPage, breadcrumb } = useNavigation();

  const renderMainContent = () => {
    if (currentPage === 'dashboard') {
      return <RoleDashboard />;
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
      {/* Floating brand above sidebar (top-left) */}
      <div className="fixed left-0 top-0 z-60 p-3 hidden lg:flex items-center space-x-3">
        <img src="/unhimas-logo.png" alt="UNHIMAS" className="w-10 h-10 object-contain bg-white rounded" />
        <div className="hidden xl:block">
          <div className="text-sm font-semibold text-gray-900">UNHIMAS</div>
          <div className="text-xs text-gray-500">School Management</div>
        </div>
      </div>
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