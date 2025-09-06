import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText, 
  PieChart, 
  BarChart3, 
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';

interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    pendingTransactions: number;
    monthlyGrowth: number;
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
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    action?: string;
  }>;
}

export const AccountingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { showToast } = useUI();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      if (currentBranch && !(user as any)?.isSuperAdmin) {
        params.append('branch', (currentBranch as any)._id);
      }

      const [summaryRes, transactionsRes] = await Promise.all([
        fetchClient.get(`/api/accounting/summary?${params.toString()}`),
        fetchClient.get(`/api/accounting?limit=10&${params.toString()}`)
      ]);

      if (!summaryRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const summaryData = await summaryRes.json();
      const transactionsData = await transactionsRes.json();

      // Mock some additional data for enhanced dashboard
      const mockData: DashboardData = {
        summary: {
          totalIncome: summaryData.summary?.totalIncome || 0,
          totalExpenses: summaryData.summary?.totalExpenses || 0,
          netIncome: summaryData.summary?.netIncome || 0,
          transactionCount: summaryData.summary?.transactionCount || 0,
          pendingTransactions: 5,
          monthlyGrowth: 12.5
        },
        recentTransactions: transactionsData.data || [],
        categoryBreakdown: summaryData.breakdown || [],
        monthlyTrends: summaryData.monthlyTrends || [],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'Monthly expenses increased by 15% compared to last month',
            action: 'View Details'
          },
          {
            id: '2',
            type: 'info',
            message: '5 transactions pending approval',
            action: 'Review'
          }
        ]
      };

      setDashboardData(mockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      showToast('Failed to load accounting dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchDashboardData();
  }, [dateRange, currentBranch]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="text-gray-600 mt-1">Financial overview and insights</p>
          {currentBranch && (
            <p className="text-sm text-blue-600 mt-1">Branch: {(currentBranch as any).name}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="text-sm border-none focus:outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="text-sm border-none focus:outline-none"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          try {
            setLoading(true);
            // TODO: Replace with actual API call
            // Example:
            // const response = await fetch('/api/accounting-dashboard');
            // const liveData = await response.json();
            // setDashboardData(liveData);
            setDashboardData(null);
          } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
          } finally {
            setLoading(false);
          }
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold">{formatXAF(dashboardData.summary.totalExpenses)}</p>
                <p className="text-red-100 text-xs mt-1">
                  ↗ +8.2% this month
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <TrendingDown className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r p-6 rounded-xl text-white ${
            dashboardData.summary.netIncome >= 0 
              ? 'from-blue-500 to-blue-600' 
              : 'from-orange-500 to-orange-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Net Income</p>
                <p className="text-2xl font-bold">{formatXAF(dashboardData.summary.netIncome)}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {dashboardData.summary.netIncome >= 0 ? 'Profit' : 'Loss'} this period
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Transactions</p>
                <p className="text-2xl font-bold">{dashboardData.summary.transactionCount}</p>
                <p className="text-purple-100 text-xs mt-1">
                  {dashboardData.summary.pendingTransactions} pending approval
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-3">
          {dashboardData.alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border flex items-center justify-between ${getAlertColor(alert.type)}`}>
              <div className="flex items-center space-x-3">
                {getAlertIcon(alert.type)}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              {alert.action && (
                <button className="text-sm underline hover:no-underline">
                  {alert.action}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              
              {/* Grid */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Income area */}
              <path
                d="M 40 120 L 80 100 L 120 80 L 160 70 L 200 60 L 240 50 L 280 45 L 320 40 L 360 35 L 360 180 L 40 180 Z"
                fill="url(#incomeGradient)"
              />
              
              {/* Expense area */}
              <path
                d="M 40 150 L 80 145 L 120 140 L 160 135 L 200 130 L 240 125 L 280 120 L 320 115 L 360 110 L 360 180 L 40 180 Z"
                fill="url(#expenseGradient)"
              />
              
              {/* Income line */}
              <path
                d="M 40 120 L 80 100 L 120 80 L 160 70 L 200 60 L 240 50 L 280 45 L 320 40 L 360 35"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Expense line */}
              <path
                d="M 40 150 L 80 145 L 120 140 L 160 135 L 200 130 L 240 125 L 280 120 L 320 115 L 360 110"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* X-axis labels */}
              <text x="60" y="195" className="text-xs fill-gray-500">Jan</text>
              <text x="120" y="195" className="text-xs fill-gray-500">Feb</text>
              <text x="180" y="195" className="text-xs fill-gray-500">Mar</text>
              <text x="240" y="195" className="text-xs fill-gray-500">Apr</text>
              <text x="300" y="195" className="text-xs fill-gray-500">May</text>
              <text x="360" y="195" className="text-xs fill-gray-500">Jun</text>
            </svg>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Income</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData?.categoryBreakdown.slice(0, 6).map((category, index) => (
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
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData?.recentTransactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatXAF(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'approved' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Add Transaction</h4>
              <p className="text-sm text-gray-600">Record new income or expense</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-600">Create financial reports</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Payment Plans</h4>
              <p className="text-sm text-gray-600">Manage payment structures</p>
            </div>
          </div>
        </button>

        <button className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Budget Analysis</h4>
              <p className="text-sm text-gray-600">Analyze spending patterns</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AccountingDashboard;