import React, { useState } from 'react';
import { 
  School, 
  Users, 
  Settings, 
  Mail, 
  BarChart3, 
  FileText,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react';
import TuitionStructureManager from '../../tuition/TuitionStructureManager';
import { formatXAF } from '../../../utils/currency';
import StudentTuitionDashboard from '../../tuition/StudentTuitionDashboard';
import TuitionReminderSystem from '../../tuition/TuitionReminderSystem';

type TabType = 'dashboard' | 'structures' | 'reminders' | 'analytics';

const IntegratedTuitionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Student Dashboard',
      icon: <Users className="w-4 h-4" />,
      description: 'Track student payments and records'
    },
    {
      id: 'structures' as TabType,
      name: 'Tuition Structures',
      icon: <Settings className="w-4 h-4" />,
      description: 'Configure payment installments'
    },
    {
      id: 'reminders' as TabType,
      name: 'Reminder System',
      icon: <Mail className="w-4 h-4" />,
      description: 'Automated payment reminders'
    },
    {
      id: 'analytics' as TabType,
      name: 'Analytics & Reports',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Financial insights and reports'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentTuitionDashboard />;
      case 'structures':
        return <TuitionStructureManager />;
      case 'reminders':
        return <TuitionReminderSystem />;
      case 'analytics':
        return <TuitionAnalytics />;
      default:
        return <StudentTuitionDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <School className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Integrated Tuition Management</h1>
        <p className="text-gray-600 mt-2">Complete tuition management with OHADA accounting integration</p>
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

      {/* Integration Status */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">OHADA</p>
            <p className="text-green-100 text-sm">Fully Integrated</p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">AUTO</p>
            <p className="text-blue-100 text-sm">Email Reminders</p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">REAL-TIME</p>
            <p className="text-green-100 text-sm">Payment Tracking</p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">ANALYTICS</p>
            <p className="text-blue-100 text-sm">Financial Insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const TuitionAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tuition Analytics & Reports</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h4 className="font-medium text-gray-900">Collection Summary</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Collected:</span>
              <span className="font-medium">{formatXAF(125000000)}</span>
            </div>
            <div className="flex justify-between">
              <span>Outstanding:</span>
              <span className="font-medium text-red-600">{formatXAF(25000000)}</span>
            </div>
            <div className="flex justify-between">
              <span>Collection Rate:</span>
              <span className="font-medium text-green-600">83.3%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h4 className="font-medium text-gray-900">Payment Timeline</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>On Time:</span>
              <span className="font-medium text-green-600">78%</span>
            </div>
            <div className="flex justify-between">
              <span>Late (1-7 days):</span>
              <span className="font-medium text-yellow-600">15%</span>
            </div>
            <div className="flex justify-between">
              <span>{'Overdue (>7 days):'}</span>
              <span className="font-medium text-red-600">7%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
            <h4 className="font-medium text-gray-900">Reminder Effectiveness</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Reminders Sent:</span>
              <span className="font-medium">234</span>
            </div>
            <div className="flex justify-between">
              <span>Response Rate:</span>
              <span className="font-medium text-green-600">67%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Response Time:</span>
              <span className="font-medium">3.2 days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p>Detailed analytics dashboard coming soon...</p>
      </div>
    </div>
  );
};

export default IntegratedTuitionManagement;