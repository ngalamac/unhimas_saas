import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Tag, 
  CreditCard, 
  School, 
  TrendingUp, 
  Eye,
  DollarSign,
  PieChart,
  Target
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  page: string;
  breadcrumb: string[];
}

const AccountingNavigation: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'overview',
      title: 'Accounting Dashboard',
      description: 'Financial overview and key metrics',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-blue-100 text-blue-600',
      page: 'accounting-overview',
      breadcrumb: ['Accounting', 'Dashboard']
    },
    {
      id: 'coordination',
      title: 'Coordination Center',
      description: 'Centralized financial coordination',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      page: 'accounting-coordination',
      breadcrumb: ['Accounting', 'Coordination Center']
    },
    {
      id: 'transactions',
      title: 'Transaction Management',
      description: 'Record and manage all transactions',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      page: 'transactions',
      breadcrumb: ['Accounting', 'Transactions']
    },
    {
      id: 'categories',
      title: 'Category Management',
      description: 'Organize transaction categories',
      icon: <Tag className="w-6 h-6" />,
      color: 'bg-orange-100 text-orange-600',
      page: 'categories',
      breadcrumb: ['Accounting', 'Categories']
    },
    {
      id: 'payment-plans',
      title: 'Payment Plans',
      description: 'Manage payment structures',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      page: 'payment-plans',
      breadcrumb: ['Accounting', 'Payment Plans']
    },
    {
      id: 'tuition-plans',
      title: 'Tuition Plans',
      description: 'Student tuition structures',
      icon: <School className="w-6 h-6" />,
      color: 'bg-pink-100 text-pink-600',
      page: 'tuition-plans',
      breadcrumb: ['Accounting', 'Tuition Plans']
    },
    {
      id: 'reports',
      title: 'Financial Reports',
      description: 'Generate comprehensive reports',
      icon: <PieChart className="w-6 h-6" />,
      color: 'bg-teal-100 text-teal-600',
      page: 'reports',
      breadcrumb: ['Accounting', 'Reports']
    },
    {
      id: 'budget-analysis',
      title: 'Budget Analysis',
      description: 'Analyze spending patterns',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-yellow-100 text-yellow-600',
      page: 'budget-analysis',
      breadcrumb: ['Accounting', 'Budget Analysis']
    },
    {
      id: 'financial-insights',
      title: 'Financial Insights',
      description: 'AI-powered financial analysis',
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-red-100 text-red-600',
      page: 'financial-insights',
      breadcrumb: ['Accounting', 'Financial Insights']
    }
  ];

  const handleNavigation = (item: NavigationItem) => {
    setCurrentPage(item.page);
    setBreadcrumb(item.breadcrumb);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Accounting Module</h2>
        <p className="text-gray-600 mt-2">Choose an accounting feature to manage</p>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Open Module</span>
                  <DollarSign className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">9</p>
            <p className="text-blue-100 text-sm">Accounting Modules</p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">234</p>
            <p className="text-blue-100 text-sm">Total Transactions</p>
          </div>
          <div className="text-center">
            <div className="bg-white bg-opacity-20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">12.5%</p>
            <p className="text-blue-100 text-sm">Monthly Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingNavigation;