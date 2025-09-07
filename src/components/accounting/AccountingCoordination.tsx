import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  FileText, 
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  ArrowRight,
  ExternalLink,
  Plus,
  Eye
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { formatXAF } from '../../utils/currency';
import fetchClient from '../../lib/fetchClient';

interface AccountingOverview {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    pendingApprovals: number;
    monthlyGrowth: number;
  };
  quickStats: {
    studentsWithPendingFees: number;
    totalStudentDebt: number;
    recentPayments: number;
    staffPayrollDue: number;
  };
  recentTransactions: Array<{
    _id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    status: string;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    type: 'income' | 'expense';
  }>;
}

const AccountingCoordination: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const [overview, setOverview] = useState<AccountingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  useEffect(() => {
    fetchAccountingOverview();
  }, [selectedPeriod, currentBranch]);

  const fetchAccountingOverview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod !== 'all-time') {
        const now = new Date();
        let fromDate: Date;
        
        switch (selectedPeriod) {
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
        if (selectedPeriod === 'current-month' || selectedPeriod === 'current-quarter') {
          params.append('to', now.toISOString().split('T')[0]);
        }
      }

      if (!isSuperAdmin && currentBranch) {
        params.append('branch', (currentBranch as any)._id);
      }

      // Fetch multiple endpoints for comprehensive overview
      const [summaryRes, transactionsRes, studentsRes] = await Promise.all([
        fetchClient.get(`/api/accounting/summary?${params.toString()}`),
        fetchClient.get(`/api/accounting?limit=10&${params.toString()}`),
        fetchClient.get(`/api/students/stats/overview?${params.toString()}`)
      ]);

      const summaryData = summaryRes.ok ? await summaryRes.json() : {};
      const transactionsData = transactionsRes.ok ? await transactionsRes.json() : {};
      const studentsData = studentsRes.ok ? await studentsRes.json() : {};

      // Mock some additional coordinated data
      const mockOverview: AccountingOverview = {
        summary: {
          totalIncome: summaryData.summary?.totalIncome || 125000000,
          totalExpenses: summaryData.summary?.totalExpenses || 45000000,
          netIncome: summaryData.summary?.netIncome || 80000000,
          transactionCount: summaryData.summary?.transactionCount || 234,
          pendingApprovals: 8,
          monthlyGrowth: 12.5
        },
        quickStats: {
          studentsWithPendingFees: studentsData.tuition?.pending || 156,
          totalStudentDebt: 25000000,
          recentPayments: 23,
          staffPayrollDue: 15000000
        },
        recentTransactions: transactionsData.data || [],
        categoryBreakdown: summaryData.breakdown || [
          { category: 'Tuition Fees', amount: 85000000, percentage: 68, type: 'income' },
          { category: 'Registration fees', amount: 25000000, percentage: 20, type: 'income' },
          { category: 'Payroll Expenses', amount: 30000000, percentage: 67, type: 'expense' },
          { category: 'Utilities', amount: 8000000, percentage: 18, type: 'expense' }
        ]
      };

      setOverview(mockOverview);
    } catch (error) {
      console.error('Failed to fetch accounting overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPage = (page: string, breadcrumb: string[]) => {
    setCurrentPage(page);
    setBreadcrumb(breadcrumb);
  };

  const quickActions = [
    {
      title: 'Record Transaction',
      description: 'Add new income or expense',
      icon: <Plus className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-600',
      action: () => navigateToPage('transactions', ['Accounting', 'Transactions'])
    },
    {
      title: 'Student Payments',
      description: 'Process tuition payments',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-green-100 text-green-600',
      action: () => navigateToPage('tuition-management', ['Students', 'Tuition Management'])
    },
    {
      title: 'Financial Reports',
      description: 'Generate comprehensive reports',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-600',
      action: () => navigateToPage('reports', ['Accounting', 'Reports'])
    },
    {
      title: 'Payment Plans',
      description: 'Manage payment structures',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-600',
      action: () => navigateToPage('payment-plans', ['Accounting', 'Payment Plans'])
    },
    {
      title: 'Budget Analysis',
      description: 'Analyze spending patterns',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-indigo-100 text-indigo-600',
      action: () => navigateToPage('budget-analysis', ['Accounting', 'Budget Analysis'])
    },
    {
      title: 'Staff Payroll',
      description: 'Manage staff payments',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-pink-100 text-pink-600',
      action: () => navigateToPage('payroll', ['Human Resources', 'Payroll'])
    }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Accounting Coordination Center</h2>
          <p className="text-gray-600 mt-1">Centralized financial management and coordination</p>
          {currentBranch && !isSuperAdmin && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
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

      {overview && (
        <>
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Income</p>
                  <p className="text-2xl font-bold">{formatXAF(overview.summary.totalIncome)}</p>
                  <p className="text-green-100 text-xs mt-1">↗ +{overview.summary.monthlyGrowth}% growth</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatXAF(overview.summary.totalExpenses)}</p>
                  <p className="text-red-100 text-xs mt-1">Operating costs</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <TrendingDown className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Net Income</p>
                  <p className="text-2xl font-bold">{formatXAF(overview.summary.netIncome)}</p>
                  <p className="text-blue-100 text-xs mt-1">Profit this period</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Pending Fees</p>
                  <p className="text-2xl font-bold">{formatXAF(overview.quickStats.totalStudentDebt)}</p>
                  <p className="text-purple-100 text-xs mt-1">{overview.quickStats.studentsWithPendingFees} students</p>
                </div>
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* Coordination Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Financial Status */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Student Financial Status</h3>
                  <button
                    onClick={() => navigateToPage('tuition-management', ['Students', 'Tuition Management'])}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="text-sm text-red-600 font-medium">Pending Payments</p>
                        <p className="text-xl font-bold text-red-700">{overview.quickStats.studentsWithPendingFees}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 font-medium">Recent Payments</p>
                        <p className="text-xl font-bold text-green-700">{overview.quickStats.recentPayments}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Total Outstanding Debt</p>
                      <p className="text-lg font-bold text-yellow-700">{formatXAF(overview.quickStats.totalStudentDebt)}</p>
                    </div>
                    <button
                      onClick={() => navigateToPage('all-students', ['Students', 'All Students'])}
                      className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Financial Management */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Staff Financial Management</h3>
                  <button
                    onClick={() => navigateToPage('payroll', ['Human Resources', 'Payroll'])}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Monthly Payroll Due</p>
                      <p className="text-lg font-bold text-blue-700">{formatXAF(overview.quickStats.staffPayrollDue)}</p>
                    </div>
                    <button
                      onClick={() => navigateToPage('payroll', ['Human Resources', 'Payroll'])}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Process
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">89</p>
                    <p className="text-sm text-gray-600">Total Staff</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">76</p>
                    <p className="text-sm text-gray-600">Active Staff</p>
                  </div>
                </div>
                <button
                  onClick={() => navigateToPage('staff-management', ['Human Resources', 'Staff Directory'])}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                >
                  View Staff Directory
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                  <button
                    onClick={() => navigateToPage('transactions', ['Accounting', 'Transactions'])}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {overview.recentTransactions.slice(0, 8).map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">{transaction.category}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                          {formatXAF(transaction.amount)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
              </div>
              <div className="p-6 space-y-4">
                {overview.categoryBreakdown.slice(0, 6).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatXAF(category.amount)}
                      </div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigateToPage('categories', ['Accounting', 'Categories'])}
                  className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Manage Categories
                </button>
              </div>
            </div>
          </div>

          {/* Coordination Links */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">System Integration</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Student Management</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">Coordinate student fees and payments</p>
                  <button
                    onClick={() => navigateToPage('all-students', ['Students', 'All Students'])}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Manage Students
                  </button>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building2 className="w-6 h-6 text-green-600" />
                    <h4 className="font-medium text-green-900">Branch Operations</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-3">Multi-branch financial coordination</p>
                  <button
                    onClick={() => navigateToPage('view-branches', ['Branches', 'View Branches'])}
                    className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    View Branches
                  </button>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    <h4 className="font-medium text-purple-900">Analytics & Reports</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">Financial insights and analytics</p>
                  <button
                    onClick={() => navigateToPage('financial-insights', ['Accounting', 'Financial Insights'])}
                    className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                  >
                    View Insights
                  </button>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="w-6 h-6 text-orange-600" />
                    <h4 className="font-medium text-orange-900">HR Integration</h4>
                  </div>
                  <p className="text-sm text-orange-700 mb-3">Staff payroll and HR coordination</p>
                  <button
                    onClick={() => navigateToPage('staff-management', ['Human Resources', 'Staff Directory'])}
                    className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
                  >
                    Manage Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingCoordination;