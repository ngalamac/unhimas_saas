import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  Plus,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import BalanceSheet from '../../accounting/BalanceSheet';
import { useAuth } from '../../../context/AuthContext';
import { useBranch } from '../../../context/BranchContext';
import { useUI } from '../../../context/UIContext';
import { useNavigation } from '../../../context/NavigationContext';
import fetchClient from '../../../lib/fetchClient';
import { formatXAF } from '../../../utils/currency';
import TransactionForm from './TransactionForm';

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description?: string;
  registeredBy: {
    name: string;
    email: string;
  };
  branch: {
    name: string;
  };
}

const AccountingOverview: React.FC = () => {
  const { setCurrentPage, setBreadcrumb } = useNavigation();
  const { showToast } = useUI();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const { user } = useAuth();
  const { managedBranches } = useBranch();
  const isSuperAdmin = (user as any)?.role === 'SuperAdmin' || (user as any)?.type === 'SuperAdmin' || (user as any)?.isSuperAdmin === true;

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      if (selectedBranch) params.append('branch', selectedBranch);

      const [summaryRes, transactionsRes, categoriesRes] = await Promise.all([
        fetchClient.get(`/api/accounting/summary?${params.toString()}`),
        fetchClient.get(`/api/accounting?limit=10&${params.toString()}`),
        fetchClient.get('/api/accounting/categories')
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch summary');
      if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');

      const summaryData = await summaryRes.json();
      const transactionsData = await transactionsRes.json();
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

      setSummary(summaryData.summary || summaryData);
      setRecentTransactions(transactionsData.data || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      setError('Error loading accounting data');
      showToast('Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange, selectedBranch]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-transaction':
        setShowTransactionForm(true);
        break;
      case 'view-transactions':
        setCurrentPage('transactions');
        setBreadcrumb(['Accounting', 'Transactions']);
        break;
      case 'view-reports':
        setCurrentPage('reports');
        setBreadcrumb(['Accounting', 'Reports']);
        break;
      case 'balance-sheet':
        setShowBalanceSheet(true);
        break;
      case 'payment-plans':
        setCurrentPage('payment-plans');
        setBreadcrumb(['Accounting', 'Payment Plans']);
        break;
      case 'categories':
        setCurrentPage('categories');
        setBreadcrumb(['Accounting', 'Categories']);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return formatXAF(amount);
  };

  const getStatusColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting Overview</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial management and insights</p>
          {selectedBranch && managedBranches.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              Branch: {managedBranches.find(b => (b as any)._id === selectedBranch)?.name || 'Selected Branch'}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
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
          <button 
            onClick={() => handleQuickAction('add-transaction')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Branch Filter for SuperAdmin */}
      {isSuperAdmin && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Branch Filter:</span>
            </div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {managedBranches.map((branch: any) => (
                <option key={branch._id || branch.id} value={branch._id || branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold">
                {summary ? formatCurrency(summary.totalIncome) : '0 XAF'}
              </p>
              <p className="text-green-100 text-xs mt-1">↗ +12% this month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingDown className="w-8 h-8" />
            </div>
            <div>
              <p className="text-red-100 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold">
                {summary ? formatCurrency(summary.totalExpenses) : '0 XAF'}
              </p>
              <p className="text-red-100 text-xs mt-1">↗ +8% this month</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r p-6 rounded-xl text-white shadow-lg ${
          summary && summary.netIncome >= 0 
            ? 'from-blue-500 to-blue-600' 
            : 'from-orange-500 to-orange-600'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Net Income</p>
              <p className="text-2xl font-bold">
                {summary ? formatCurrency(summary.netIncome) : '0 XAF'}
              </p>
              <p className="text-blue-100 text-xs mt-1">
                {summary && summary.netIncome >= 0 ? 'Profit' : 'Loss'} this period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-purple-100 text-sm font-medium">Transactions</p>
              <p className="text-2xl font-bold">
                {summary ? summary.transactionCount : 0}
              </p>
              <p className="text-purple-100 text-xs mt-1">This period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={() => handleQuickAction('add-transaction')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Add Transaction</h4>
              <p className="text-sm text-gray-600">Record new income or expense</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleQuickAction('view-transactions')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">View All Transactions</h4>
              <p className="text-sm text-gray-600">Browse transaction history</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleQuickAction('balance-sheet')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Balance Sheet</h4>
              <p className="text-sm text-gray-600">View financial position</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleQuickAction('view-reports')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
              <PieChart className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Financial Reports</h4>
              <p className="text-sm text-gray-600">Generate detailed reports</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleQuickAction('payment-plans')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Payment Plans</h4>
              <p className="text-sm text-gray-600">Manage payment structures</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleQuickAction('categories')}
          className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-teal-100 p-3 rounded-lg group-hover:bg-teal-200 transition-colors">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Categories</h4>
              <p className="text-sm text-gray-600">Manage transaction categories</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button 
              onClick={() => handleQuickAction('view-transactions')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
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
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
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
                      {getStatusIcon(transaction.type)}
                      <span className="ml-1 capitalize">{transaction.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{transaction.description || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.branch?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.registeredBy?.name || '—'}
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
          {recentTransactions.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions found</h3>
              <p className="text-sm text-gray-500">No transactions found for the selected period.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <TransactionForm 
              onCreated={() => {
                setShowTransactionForm(false);
                fetchSummary();
                showToast('Transaction created successfully', 'success');
              }}
              onCancel={() => setShowTransactionForm(false)}
              showTrigger={false}
            />
          </div>
        </div>
      )}

      {/* Balance Sheet Modal */}
      {showBalanceSheet && (
        <BalanceSheet 
          onClose={() => setShowBalanceSheet(false)} 
          branch={selectedBranch || undefined} 
        />
      )}
    </div>
  );
};

export default AccountingOverview;