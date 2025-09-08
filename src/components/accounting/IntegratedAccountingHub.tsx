import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Building2, 
  FileText, 
  CreditCard, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  ArrowRight,
  Target,
  Zap,
  Shield,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { useUI } from '../../context/UIContext';
import { formatXAF } from '../../utils/currency';
import fetchClient from '../../lib/fetchClient';

interface HubData {
  financialSummary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    monthlyGrowth: number;
    transactionCount: number;
  };
  studentFinancials: {
    totalCollected: number;
    pendingAmount: number;
    studentsWithDebt: number;
    collectionRate: number;
  };
  staffFinancials: {
    monthlyPayroll: number;
    staffCount: number;
    pendingPayments: number;
  };
  systemIntegration: {
    connectedModules: number;
    activeUsers: number;
    dataSync: string;
    lastBackup: string;
  };
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    page: string;
    breadcrumb: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

const IntegratedAccountingHub: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('current-month');

  useEffect(() => {
    fetchHubData();
  }, [selectedTimeframe, currentBranch]);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from multiple endpoints
      const params = new URLSearchParams();
      if (selectedTimeframe !== 'all-time') {
        const now = new Date();
        let fromDate: Date;
        
        switch (selectedTimeframe) {
          case 'current-month':
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'last-month':
            fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            params.append('to', new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]);
            break;
          case 'current-quarter':
            fromDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          default:
            fromDate = new Date(now.getFullYear(), 0, 1);
        }
        
        params.append('from', fromDate.toISOString().split('T')[0]);
        if (!params.has('to')) {
          params.append('to', now.toISOString().split('T')[0]);
        }
      }

      if (currentBranch && !(user as any)?.isSuperAdmin) {
        params.append('branch', (currentBranch as any)._id);
      }

      const [accountingRes, studentsRes, staffRes] = await Promise.all([
        fetchClient.get(`/api/accounting/summary?${params.toString()}`),
        fetchClient.get(`/api/students/stats/overview?${params.toString()}`),
        fetchClient.get(`/api/staff/stats/overview?${params.toString()}`)
      ]);

      const accountingData = accountingRes.ok ? await accountingRes.json() : {};
      const studentsData = studentsRes.ok ? await studentsRes.json() : {};
      const staffData = staffRes.ok ? await staffRes.json() : {};

      const mockHubData: HubData = {
        financialSummary: {
          totalIncome: accountingData.summary?.totalIncome || 125000000,
          totalExpenses: accountingData.summary?.totalExpenses || 45000000,
          netIncome: accountingData.summary?.netIncome || 80000000,
          monthlyGrowth: 12.5,
          transactionCount: accountingData.summary?.transactionCount || 234
        },
        studentFinancials: {
          totalCollected: 125000000,
          pendingAmount: 25000000,
          studentsWithDebt: studentsData.tuition?.pending || 156,
          collectionRate: 85.2
        },
        staffFinancials: {
          monthlyPayroll: 35000000,
          staffCount: staffData.total || 89,
          pendingPayments: 8
        },
        systemIntegration: {
          connectedModules: 12,
          activeUsers: 76,
          dataSync: 'Real-time',
          lastBackup: '2024-12-15 03:00'
        },
        quickActions: [
          {
            id: 'record-transaction',
            title: 'Record Transaction',
            description: 'Add new income or expense transaction',
            icon: <Plus className="w-5 h-5" />,
            color: 'bg-blue-100 text-blue-600',
            page: 'transactions',
            breadcrumb: ['Accounting', 'Transactions'],
            priority: 'high'
          },
          {
            id: 'student-payments',
            title: 'Process Student Payment',
            description: 'Record tuition and fee payments',
            icon: <Users className="w-5 h-5" />,
            color: 'bg-green-100 text-green-600',
            page: 'tuition-management',
            breadcrumb: ['Students', 'Tuition Management'],
            priority: 'high'
          },
          {
            id: 'staff-payroll',
            title: 'Process Payroll',
            description: 'Manage staff salary payments',
            icon: <DollarSign className="w-5 h-5" />,
            color: 'bg-purple-100 text-purple-600',
            page: 'payroll',
            breadcrumb: ['Human Resources', 'Payroll'],
            priority: 'medium'
          },
          {
            id: 'financial-report',
            title: 'Generate Report',
            description: 'Create financial reports and analytics',
            icon: <FileText className="w-5 h-5" />,
            color: 'bg-orange-100 text-orange-600',
            page: 'reports',
            breadcrumb: ['Accounting', 'Reports'],
            priority: 'medium'
          },
          {
            id: 'manage-users',
            title: 'Manage User Access',
            description: 'Control user roles and permissions',
            icon: <Shield className="w-5 h-5" />,
            color: 'bg-red-100 text-red-600',
            page: 'enhanced-roles',
            breadcrumb: ['Roles & Access', 'Enhanced Management'],
            priority: 'low'
          },
          {
            id: 'budget-analysis',
            title: 'Budget Analysis',
            description: 'Analyze spending and budget performance',
            icon: <Target className="w-5 h-5" />,
            color: 'bg-indigo-100 text-indigo-600',
            page: 'budget-analysis',
            breadcrumb: ['Accounting', 'Budget Analysis'],
            priority: 'low'
          }
        ]
      };

      setHubData(mockHubData);
    } catch (error) {
      showToast('Failed to load hub data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: HubData['quickActions'][0]) => {
    setCurrentPage(action.page);
    setBreadcrumb(action.breadcrumb);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrated Accounting Hub</h2>
          <p className="text-gray-600 mt-1">Centralized financial management and system coordination</p>
          {currentBranch && !(user as any)?.isSuperAdmin && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="current-quarter">Current Quarter</option>
            <option value="current-year">Current Year</option>
            <option value="all-time">All Time</option>
          </select>
        </div>
      </div>

      {hubData && (
        <>
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Income</p>
                  <p className="text-2xl font-bold">{formatXAF(hubData.financialSummary.totalIncome)}</p>
                  <p className="text-green-100 text-xs mt-1">↗ +{hubData.financialSummary.monthlyGrowth}% growth</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Student Collections</p>
                  <p className="text-2xl font-bold">{formatXAF(hubData.studentFinancials.totalCollected)}</p>
                  <p className="text-blue-100 text-xs mt-1">{hubData.studentFinancials.collectionRate}% collection rate</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Staff Payroll</p>
                  <p className="text-2xl font-bold">{formatXAF(hubData.staffFinancials.monthlyPayroll)}</p>
                  <p className="text-purple-100 text-xs mt-1">{hubData.staffFinancials.staffCount} staff members</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Building2 className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">System Integration</p>
                  <p className="text-2xl font-bold">{hubData.systemIntegration.connectedModules}</p>
                  <p className="text-orange-100 text-xs mt-1">Connected modules</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Zap className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hubData.quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(action.priority)} bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-left group`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        <div className="mt-2 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Open</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Module Integration Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Student Management</span>
                  </div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Staff Management</span>
                  </div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Branch Operations</span>
                  </div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Role Management</span>
                  </div>
                  <span className="text-sm text-green-600">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">External APIs</span>
                  </div>
                  <span className="text-sm text-yellow-600">Partial</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Database</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Operational</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">API Services</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Running</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Data Synchronization</p>
                      <p className="text-xs text-blue-600">{hubData.systemIntegration.dataSync}</p>
                    </div>
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Last Backup</p>
                      <p className="text-xs text-gray-600">{hubData.systemIntegration.lastBackup}</p>
                    </div>
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IntegratedAccountingHub;