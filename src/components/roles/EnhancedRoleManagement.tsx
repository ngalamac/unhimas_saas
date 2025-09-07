import React, { useState } from 'react';
import { Shield, Users, Settings, BarChart3, Eye, UserPlus } from 'lucide-react';
import PermissionMatrix from './PermissionMatrix';
import RoleTemplates from './RoleTemplates';
import UserRoleAssignment from './UserRoleAssignment';
import AccessControlDashboard from './AccessControlDashboard';

type TabType = 'dashboard' | 'matrix' | 'templates' | 'assignment';

const EnhancedRoleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Access Dashboard',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Overview of access control and security'
    },
    {
      id: 'matrix' as TabType,
      name: 'Permission Matrix',
      icon: <Shield className="w-4 h-4" />,
      description: 'Detailed permission management'
    },
    {
      id: 'templates' as TabType,
      name: 'Role Templates',
      icon: <Settings className="w-4 h-4" />,
      description: 'Pre-configured role templates'
    },
    {
      id: 'assignment' as TabType,
      name: 'User Assignment',
      icon: <UserPlus className="w-4 h-4" />,
      description: 'Assign roles to users'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AccessControlDashboard />;
      case 'matrix':
        return <PermissionMatrix />;
      case 'templates':
        return <RoleTemplates />;
      case 'assignment':
        return <UserRoleAssignment />;
      default:
        return <AccessControlDashboard />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role & Access Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive user access control and security management</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Security Active
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Description */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedRoleManagement;